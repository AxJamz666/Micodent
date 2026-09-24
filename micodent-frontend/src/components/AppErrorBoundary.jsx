import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main role="alert" className="min-h-screen flex items-center justify-center p-6 bg-white">
      <section className="max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">No se pudo mostrar esta pantalla</h1>
        <p>Si acababas de guardar, consulta el registro antes de repetir la operación.</p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-teal-700 text-white rounded" onClick={() => window.location.reload()}>Volver a cargar</button>
          <a className="px-4 py-2 border rounded" href="/">Ir al inicio</a>
        </div>
      </section>
    </main>;
  }
}
