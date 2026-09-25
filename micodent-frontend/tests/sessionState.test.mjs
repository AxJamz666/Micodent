import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionState, sessionProfile, SESSION_EVENT_KEY } from '../src/services/sessionState.js';
const user={id:'fixture',nombre:'Prueba',nombre_completo:'Usuario Prueba',rol:'Doctor',is_admin:0};
const a={id:'a'.repeat(64),csrf:'b'.repeat(64)}, b={id:'c'.repeat(64),csrf:'d'.repeat(64)};
function fixture(epoch=a.id) {
  const values=new Map([['token','obsolete-bearer'],['isAdmin','true']]);
  if(epoch)values.set(SESSION_EVENT_KEY,epoch);
  const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  return {values,storage,state:createSessionState(storage,()=> 'test-event')};
}
test('legacy bearer is removed and cached permissions cannot mount private screens',()=>{
  const {state,storage}=fixture();
  assert.equal(storage.getItem('token'),null);
  assert.equal(state.getSnapshot().status,'checking');
  assert.equal(state.getSnapshot().user,null);
  state.verified(user,a,a.id);
  assert.equal(state.getSnapshot().user.isAdmin,false);
  assert.equal(storage.getItem('isAdmin'),'false');
});
test('CSRF remains in memory; storage only holds a non-authenticating marker and profile',()=>{
  const {state,values}=fixture();state.verified(user,a,a.id);
  assert.equal([...values.values()].includes(a.csrf),false);
  assert.equal(state.requestContext().csrf,a.csrf);
  assert.equal('csrf' in state.getSnapshot(),false);
});
test('profile excludes signatures, stamps and personal contact data',()=>{
  const profile=sessionProfile({...user,firma_digital:'private',email:'private',sello_digital:'private'});
  for(const key of ['firma_digital','email','sello_digital'])assert.equal(key in profile,false);
  assert.throws(()=>sessionProfile({}),/INVALID_SESSION_PROFILE/);
  assert.equal(sessionProfile({...user,is_admin:'false'}).isAdmin,false);
  assert.equal(sessionProfile({...user,is_admin:1}).isAdmin,true);
});
test('requests detect another login before storage events are delivered',()=>{
  const {state,storage}=fixture();state.verified(user,a,a.id);
  storage.setItem(SESSION_EVENT_KEY,b.id);
  assert.throws(()=>state.requestContext(),{code:'SESSION_CHANGED'});
  assert.equal(state.getSnapshot().status,'changed');
  assert.equal(storage.getItem(SESSION_EVENT_KEY),b.id);
});
test('delayed responses never overwrite or clear another login',()=>{
  for(const method of ['verified','expire','end']){
    const {state,storage}=fixture();storage.setItem(SESSION_EVENT_KEY,b.id);
    assert.throws(()=>method==='verified'?state.verified(user,a,a.id):state[method](a.id),{code:'SESSION_CHANGED'});
    assert.equal(storage.getItem(SESSION_EVENT_KEY),b.id);
  }
});
test('storage clear locks permanently even if the old marker returns',()=>{
  const {state,storage}=fixture();storage.removeItem(SESSION_EVENT_KEY);state.checkStorage({key:null});
  storage.setItem(SESSION_EVENT_KEY,a.id);
  assert.throws(()=>state.requestContext(),{code:'SESSION_CHANGED'});
});
test('queued change events lock but unrelated storage events do not',()=>{
  const {state}=fixture();state.checkStorage({key:'theme',newValue:'dark'});
  assert.equal(state.getSnapshot().status,'checking');
  state.checkStorage({key:SESSION_EVENT_KEY,newValue:b.id});
  assert.equal(state.getSnapshot().status,'changed');
});
test('verification failure permits retry without granting private API access',()=>{
  const {state,storage}=fixture();state.unavailable(a.id);
  assert.equal(storage.getItem(SESSION_EVENT_KEY),a.id);
  assert.throws(()=>state.requestContext(),{code:'SESSION_CHANGED'});
  state.retry();assert.equal(state.requestContext({bootstrap:true}).epoch,a.id);
  state.verified(user,a,a.id);assert.equal(state.getSnapshot().status,'ready');
});
test('anonymous bootstrap does not log out other anonymous tabs',()=>{
  for(const epoch of [null,'signed-out:test']){
    const {state,storage}=fixture(epoch);state.expire(epoch);
    assert.equal(state.getSnapshot().status,'anonymous');
    assert.equal(storage.getItem(SESSION_EVENT_KEY),epoch);
    assert.equal(state.requestContext({login:true}).epoch,epoch);
  }
});
test('new login is verified before mounting and stale local responses do not lock it',()=>{
  const {state,storage}=fixture(null);state.expire(null);
  state.acceptLogin(a,null);assert.equal(state.getSnapshot().status,'checking');
  assert.equal(storage.getItem(SESSION_EVENT_KEY),a.id);
  assert.throws(()=>state.assertCurrent(null),{code:'SESSION_CHANGED'});
  assert.equal(state.getSnapshot().status,'checking');
  state.verified(user,a,a.id);state.end(a.id);
  assert.equal(state.getSnapshot().status,'anonymous');
  assert.equal(storage.getItem(SESSION_EVENT_KEY),'signed-out:test-event');
});
test('401 locks existing drafts; invalid session context never grants access',()=>{
  const {state}=fixture();assert.throws(()=>state.verified(user,{},a.id),/INVALID_SESSION_CONTEXT/);
  state.verified(user,a,a.id);state.expire(a.id);
  assert.equal(state.getSnapshot().status,'expired');assert.equal(state.getSnapshot().user.id,user.id);
  assert.throws(()=>state.requestContext(),{code:'SESSION_CHANGED'});
});
test('server session mismatch locks without modifying shared state',()=>{
  const {state,storage}=fixture();state.verified(user,a,a.id);state.changed(a.id);
  assert.equal(state.getSnapshot().status,'changed');assert.equal(storage.getItem(SESSION_EVENT_KEY),a.id);
});
test('subscriptions notify state changes and can unsubscribe',()=>{
  const {state}=fixture();let count=0;const off=state.subscribe(()=>count++);
  state.verified(user,a,a.id);off();state.end(a.id);assert.equal(count,1);
});
