import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionState, sessionProfile } from '../src/services/sessionState.js';

const user = { id: 'test-user', nombre: 'Prueba', nombre_completo: 'Usuario Prueba', rol: 'Doctor', is_admin: 0 };
function setup(token = 'synthetic-a') {
  const values = new Map(token ? [['token', token], ['isAdmin', 'true']] : []);
  const storage = { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  return { storage, state: createSessionState(storage) };
}
test('cached admin flags do not authorize; only the verified server profile does', () => {
  const {state,storage} = setup();
  assert.equal(state.getSnapshot().status,'checking');
  assert.equal(state.getSnapshot().user,null);
  state.verified(user,'synthetic-a');
  assert.equal(state.getSnapshot().user.isAdmin,false);
  assert.equal(storage.getItem('isAdmin'),'false');
  assert.equal(storage.getItem('userFullName'),'Usuario Prueba');
});
test('profile cache excludes personal contact, signatures, stamps and unknown fields', () => {
  const profile = sessionProfile({...user,firma_digital:'private',sello_digital:'private',email:'private',token:'private'});
  for (const field of ['firma_digital','sello_digital','email','token']) assert.equal(field in profile,false);
  assert.throws(()=>sessionProfile({}),/INVALID_SESSION_PROFILE/);
  assert.equal(sessionProfile({...user,is_admin:'false'}).isAdmin,false);
  assert.equal(sessionProfile({...user,is_admin:1}).isAdmin,true);
});
test('requests detect a different login even before the storage event is delivered', () => {
  const {state,storage} = setup();
  state.verified(user,'synthetic-a');
  storage.setItem('token','synthetic-b');
  assert.throws(()=>state.requestToken(false),{code:'SESSION_CHANGED'});
  assert.equal(state.getSnapshot().status,'changed');
  assert.equal(storage.getItem('token'),'synthetic-b');
});
test('delayed success and delayed 401 cannot update or remove a newer session', () => {
  for (const op of ['verified','expire','end']) {
    const {state,storage} = setup();
    storage.setItem('token','synthetic-b');
    assert.throws(()=>op==='verified' ? state.verified(user,'synthetic-a') : state[op]('synthetic-a'),{code:'SESSION_CHANGED'});
    assert.equal(storage.getItem('token'),'synthetic-b');
  }
});
test('a storage clear or logout permanently locks the tab, even if the old token is restored', () => {
  const {state,storage} = setup();
  storage.removeItem('token');
  state.checkStorage({key:null});
  storage.setItem('token','synthetic-a');
  assert.throws(()=>state.requestToken(false),{code:'SESSION_CHANGED'});
});
test('queued token change events detect an intervening different session', () => {
  const {state} = setup();
  state.checkStorage({key:'token',newValue:'synthetic-b'});
  assert.equal(state.getSnapshot().status,'changed');
});
test('unrelated storage changes do not interrupt the current session', () => {
  const {state} = setup();
  state.checkStorage({key:'theme',newValue:'dark'});
  assert.equal(state.getSnapshot().status,'checking');
});
test('temporary verification failures retain credentials and permit retry', () => {
  const {state,storage} = setup();
  state.unavailable('synthetic-a');
  assert.equal(storage.getItem('token'),'synthetic-a');
  assert.throws(()=>state.requestToken(false),{code:'SESSION_CHANGED'});
  state.retry();
  state.verified(user,'synthetic-a');
  assert.equal(state.getSnapshot().status,'ready');
});
test('new login requires server verification and stale anonymous login cannot overwrite another tab', () => {
  const {state,storage} = setup(null);
  assert.equal(state.requestToken(true),null);
  state.acceptLogin('synthetic-a',null);
  assert.equal(state.getSnapshot().status,'checking');
  assert.equal(state.getSnapshot().user,null);
  state.verified(user,'synthetic-a');
  state.end('synthetic-a');
  assert.equal(state.getSnapshot().status,'anonymous');
  storage.setItem('token','synthetic-b');
  assert.throws(()=>state.acceptLogin('synthetic-c',null),{code:'SESSION_CHANGED'});
  assert.equal(storage.getItem('token'),'synthetic-b');
});
test('401 expires only matching credentials; drafts keep their verified owner in memory', () => {
  const {state,storage} = setup();
  state.verified(user,'synthetic-a');
  state.expire('synthetic-a');
  assert.equal(storage.getItem('token'),null);
  assert.equal(state.getSnapshot().status,'expired');
  assert.equal(state.getSnapshot().user.id,user.id);
  assert.throws(()=>state.requestToken(false),{code:'SESSION_CHANGED'});
});
test('subscriptions notify transitions and support cleanup', () => {
  const {state} = setup();
  let calls=0;
  const unsubscribe=state.subscribe(()=>calls++);
  state.verified(user,'synthetic-a');
  unsubscribe();
  state.end('synthetic-a');
  assert.equal(calls,1);
});
