import React, { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const STORAGE_KEYS = {
  users: 'aesthetica_users',
  services: 'aesthetica_services',
  appointments: 'aesthetica_appointments',
  session: 'aesthetica_current_user',
};

const initialUsers = [
  { id: 1, name: 'Administrador', email: 'admin@aesthetica.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Cliente Demo', email: 'cliente@aesthetica.com', password: 'cliente123', role: 'client' },
];

const initialServices = [
  { id: 1, name: 'Limpieza facial', price: 35, duration: '45Min', description: 'Piel luminosa y revitalizada.' },
  { id: 2, name: 'Masaje corporal', price: 50, duration: '60Min', description: 'Relajación profunda y alivio muscular.' },
  { id: 3, name: 'Manicure Spa', price: 25, duration: '30Min', description: 'Cuidado premium para tus manos.' },
  { id: 4, name: 'Tratamiento facial', price: 65, duration: '75Min', description: 'Hidratación, limpieza y rejuvenecimiento.' },
];

const initialAppointments = [
  { id: 1, userId: 2, serviceId: 1, serviceName: 'Limpieza facial', price: 35, specialist: 'Ana Martínez', date: '2026-09-28', time: '10:00', status: 'confirmado' },
  { id: 2, userId: 2, serviceId: 2, serviceName: 'Masaje corporal', price: 50, specialist: 'Juan Alberto', date: '2026-09-29', time: '13:30', status: 'pendiente' },
];

const timeOptions = ['10:00', '11:00', '13:00', '14:30', '16:00', '17:30'];
const specialistOptions = ['Ana Martínez', 'Juan Alberto', 'Elena Gómez'];

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.session, null));
  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, initialUsers));
  const [services, setServices] = useState(() => readStorage(STORAGE_KEYS.services, initialServices));
  const [appointments, setAppointments] = useState(() => readStorage(STORAGE_KEYS.appointments, initialAppointments));
  const [pendingReservation, setPendingReservation] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: 'admin@aesthetica.com', password: 'admin123' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [bookingForm, setBookingForm] = useState({
    serviceId: initialServices[0].id,
    date: '2026-09-30',
    time: '10:00',
    specialist: specialistOptions[0],
  });
  const [paymentForm, setPaymentForm] = useState({ method: 'online', card: '', exp: '', cvc: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', duration: '', description: '' });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin' && currentView !== 'admin') {
      setCurrentView('admin');
    }
  }, [currentUser, currentView]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === Number(bookingForm.serviceId)) || services[0],
    [services, bookingForm.serviceId]
  );

  const chartData = useMemo(() => {
    const totals = services.map((service) => {
      const serviceAppointments = appointments.filter((appointment) => appointment.serviceId === service.id);
      return serviceAppointments.length;
    });

    return {
      labels: services.map((service) => service.name),
      datasets: [{
        label: 'Servicios reservados',
        data: totals,
        backgroundColor: '#8C5158',
      }],
    };
  }, [services, appointments]);

  const dashboardStats = useMemo(() => {
    const totalRevenue = appointments.reduce((sum, appointment) => sum + Number(appointment.price || 0), 0);
    const pending = appointments.filter((item) => item.status === 'pendiente').length;
    const confirmed = appointments.filter((item) => item.status === 'confirmado').length;

    return {
      totalRevenue,
      pending,
      confirmed,
    };
  }, [appointments]);

  const handleLogin = (event) => {
    event.preventDefault();

    const user = users.find(
      (item) => item.email.toLowerCase() === loginForm.email.trim().toLowerCase() && item.password === loginForm.password
    );

    if (!user) {
      setNotice({ type: 'error', text: 'Credenciales incorrectas. Intenta con admin@aesthetica.com / admin123' });
      return;
    }

    setCurrentUser(user);
    setNotice({ type: 'success', text: `Bienvenido ${user.name}` });
    setCurrentView(user.role === 'admin' ? 'admin' : 'home');
    setLoginForm({ email: '', password: '' });
  };

  const handleRegister = (event) => {
    event.preventDefault();

    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim()) {
      setNotice({ type: 'error', text: 'Todos los campos son obligatorios.' });
      return;
    }

    if (registerForm.password.length < 6) {
      setNotice({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setNotice({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    const emailExists = users.some((user) => user.email.toLowerCase() === registerForm.email.trim().toLowerCase());
    if (emailExists) {
      setNotice({ type: 'error', text: 'Ese correo ya está registrado.' });
      return;
    }

    const newUser = {
      id: Date.now(),
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      role: 'client',
    };

    setUsers((current) => [...current, newUser]);
    setNotice({ type: 'success', text: 'Usuario registrado correctamente.' });
    setAuthMode('login');
    setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleBooking = (event) => {
    event.preventDefault();

    if (!currentUser) {
      setCurrentView('login');
      setNotice({ type: 'error', text: 'Debes iniciar sesión para reservar.' });
      return;
    }

    const reservation = {
      id: Date.now(),
      userId: currentUser.id,
      serviceId: Number(bookingForm.serviceId),
      serviceName: selectedService.name,
      price: Number(selectedService.price),
      specialist: bookingForm.specialist,
      date: bookingForm.date,
      time: bookingForm.time,
      status: 'pendiente',
    };

    setPendingReservation(reservation);
    setCurrentView('payment');
  };

  const handlePayment = (event) => {
    event.preventDefault();

    if (!pendingReservation) {
      setNotice({ type: 'error', text: 'No hay reserva pendiente.' });
      return;
    }

    if (!paymentForm.card.trim() || !paymentForm.exp.trim() || !paymentForm.cvc.trim()) {
      setNotice({ type: 'error', text: 'Completa los datos de pago.' });
      return;
    }

    const confirmedReservation = {
      ...pendingReservation,
      status: 'confirmado',
    };

    setAppointments((current) => [confirmedReservation, ...current]);
    setPendingReservation(null);
    setPaymentForm({ method: 'online', card: '', exp: '', cvc: '' });
    setCurrentView('home');
    setNotice({ type: 'success', text: '¡Reserva confirmada con éxito!' });
  };

  const handleServiceSubmit = (event) => {
    event.preventDefault();

    if (!serviceForm.name.trim() || !serviceForm.price || !serviceForm.duration.trim()) {
      setNotice({ type: 'error', text: 'Nombre, precio y duración son obligatorios.' });
      return;
    }

    if (editingServiceId) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingServiceId ? { ...service, ...serviceForm, price: Number(serviceForm.price) } : service
        )
      );
      setNotice({ type: 'success', text: 'Servicio actualizado correctamente.' });
    } else {
      const newService = {
        id: Date.now(),
        name: serviceForm.name.trim(),
        price: Number(serviceForm.price),
        duration: serviceForm.duration.trim(),
        description: serviceForm.description.trim() || 'Servicio disponible en la clínica.',
      };

      setServices((current) => [newService, ...current]);
      setNotice({ type: 'success', text: 'Servicio agregado correctamente.' });
    }

    setServiceForm({ name: '', price: '', duration: '', description: '' });
    setEditingServiceId(null);
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description,
    });
  };

  const handleDeleteService = (serviceId) => {
    setServices((current) => current.filter((service) => service.id !== serviceId));
    setAppointments((current) => current.filter((item) => item.serviceId !== serviceId));
    setNotice({ type: 'success', text: 'Servicio eliminado.' });
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setNotice({ type: 'success', text: 'Sesión cerrada.' });
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="brand-logo">Aesthetica</div>
        <nav>
          <ul className="nav-links">
            <li><button onClick={() => setCurrentView('home')}>Inicio</button></li>
            <li><button onClick={() => setCurrentView('home')}>Servicios</button></li>
            <li><button onClick={() => setCurrentView('booking')}>Reservar</button></li>
            {currentUser?.role === 'admin' ? (
              <>
                <li><button onClick={() => setCurrentView('admin')}>Admin</button></li>
                <li><button className="btn-primary" onClick={logout}>Cerrar sesión</button></li>
              </>
            ) : currentUser ? (
              <li><button className="btn-primary" onClick={logout}>Mi cuenta</button></li>
            ) : (
              <li><button className="btn-primary" onClick={() => setCurrentView('login')}>Iniciar sesión</button></li>
            )}
          </ul>
        </nav>
      </header>

      {notice.text && <div className={`message ${notice.type}`}>{notice.text}</div>}

      {currentView === 'home' && (
        <main>
          <section className="hero-section">
            <div className="container hero-inner">
              <div className="hero-copy">
                <span className="eyebrow">Belleza • bienestar • confianza</span>
                <h1 className="hero-title">Tu belleza y bienestar, en un solo lugar.</h1>
                <p className="hero-subtitle">Citas premium, servicios personalizados y atención para cada momento de tu rutina.</p>
                <div className="hero-actions">
                  <button className="btn-secondary" onClick={() => setCurrentView('home')}>Ver servicios</button>
                  <button className="btn-primary" onClick={() => setCurrentView('booking')}>Reservar cita</button>
                </div>
                <div className="stats-row">
                  <div>
                    <strong>10k+</strong>
                    <span>Clientes felices</span>
                  </div>
                  <div>
                    <strong>4.9/5</strong>
                    <span>Valoración</span>
                  </div>
                  <div>
                    <strong>15+</strong>
                    <span>Especialistas</span>
                  </div>
                </div>
              </div>

              <div className="hero-visual" aria-label="hero visual">
                <div className="hero-glow" />
                <div className="visual-badge">Aesthetica</div>
                <div className="visual-card large-card">
                  <span>Tratamiento facial</span>
                  <strong>Revitaliza tu piel</strong>
                  <div className="mini-tag">Desde $35</div>
                </div>
                <div className="visual-card mini-card">
                  <strong>99%</strong>
                  <span>pacientes satisfechos</span>
                </div>
              </div>
            </div>
          </section>

          <section className="container section-block">
            <div className="section-header">
              <span className="eyebrow">Servicios</span>
              <h2 className="section-title">Nuestros tratamientos</h2>
            </div>
            <div className="grid-3">
              {services.map((service) => (
                <article className="card" key={service.id}>
                  <div className="card-topline">{service.duration}</div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <p className="price-tag">${service.price}.00</p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setBookingForm((current) => ({ ...current, serviceId: service.id }));
                      setCurrentView('booking');
                    }}
                  >
                    Reservar
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="container section-block split-section">
            <div className="info-panel">
              <span className="eyebrow">Nuestra diferencia</span>
              <h3>Tu cuidado, diseñado para sentirse único.</h3>
              <ul>
                <li>Consulta personalizada con cada cliente.</li>
                <li>Productos premium y protocolos actualizados.</li>
                <li>Ambiente tranquilo, limpio y exclusivo.</li>
              </ul>
              <button className="btn-primary" onClick={() => setCurrentView('booking')}>Agendar ahora</button>
            </div>

            <div className="image-panel">
              <div className="image-box">
                <span>Consulta personalizada</span>
              </div>
            </div>
          </section>

          <section className="container section-block specialists-section">
            <div className="section-header">
              <span className="eyebrow">Especialistas</span>
              <h2 className="section-title">Conoce a nuestro equipo</h2>
            </div>
            <div className="specialist-grid">
              {['Ana Martínez', 'Juan Alberto', 'Elena Gómez'].map((person, index) => (
                <div className="specialist-item" key={person}>
                  <div className="avatar">{person.split(' ')[0].slice(0, 1)}</div>
                  <h4>{person}</h4>
                  <p>{index === 0 ? 'Especialista facial' : index === 1 ? 'Masajista corporal' : 'Manicurista'}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="container section-block cta-banner">
            <div>
              <span className="eyebrow">Reserva tu cita</span>
              <h3>Cuida tu bienestar con una experiencia premium.</h3>
            </div>
            <button className="btn-primary" onClick={() => setCurrentView('booking')}>Reservar ahora</button>
          </section>

          <section className="container section-block">
            <h2 className="section-title">Encuéntranos</h2>
            <div className="map-container">Soyapango, San Salvador · Atención de lunes a domingo</div>
          </section>
        </main>
      )}

      {currentView === 'booking' && (
        <main className="container section-block">
          <h2 className="section-title">Reserva tu cita</h2>
          <form onSubmit={handleBooking} className="booking-form">
            <div className="two-columns">
              <div className="selection-box">
                <h3>SELECCIONA EL SERVICIO</h3>
                <div className="form-group">
                  <label>Servicio</label>
                  <select
                    className="form-input"
                    value={bookingForm.serviceId}
                    onChange={(event) => setBookingForm({ ...bookingForm, serviceId: Number(event.target.value) })}
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingForm.date}
                    onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <div className="time-slots">
                    {timeOptions.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`slot-btn ${bookingForm.time === time ? 'active' : ''}`}
                        onClick={() => setBookingForm({ ...bookingForm, time })}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="selection-box">
                <h3>ELIGE TU ESPECIALISTA</h3>
                <div className="specialist-list">
                  {specialistOptions.map((person) => (
                    <div
                      key={person}
                      className={`specialist-card ${bookingForm.specialist === person ? 'selected' : ''}`}
                      onClick={() => setBookingForm({ ...bookingForm, specialist: person })}
                    >
                      <input type="radio" checked={bookingForm.specialist === person} readOnly />
                      <div>
                        <strong>{person}</strong>
                        <small>Especialista</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="booking-resume-box">
              <div>
                <strong>RESUMEN:</strong> {selectedService.name} | {bookingForm.date} | {bookingForm.time} | {bookingForm.specialist} | ${selectedService.price}.00
              </div>
              <button className="btn-primary" type="submit">Continuar al pago</button>
            </div>
          </form>
        </main>
      )}

      {currentView === 'login' && (
        <main className="container auth-container section-block">
          <div className="selection-box auth-box">
            <div className="auth-tabs">
              <button type="button" className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>Iniciar sesión</button>
              <button type="button" className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>Registrarse</button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin}>
                <h2>Acceso a tu cuenta</h2>
                <div className="form-group auth-group">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
                <div className="form-group auth-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <button className="btn-primary auth-button" type="submit">Ingresar</button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h2>Crear cuenta</h2>
                <div className="form-group auth-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    className="form-input"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="form-group auth-group">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="form-group auth-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    value={registerForm.password}
                    onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="form-group auth-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    value={registerForm.confirmPassword}
                    onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                    placeholder="Repite tu contraseña"
                  />
                </div>
                <button className="btn-primary auth-button" type="submit">Registrarme</button>
              </form>
            )}
          </div>
        </main>
      )}

      {currentView === 'payment' && (
        <main className="container section-block">
          <h2 className="section-title">Confirmación y Pago</h2>
          <form onSubmit={handlePayment} className="two-columns">
            <div className="selection-box">
              <h3>MÉTODOS DE PAGO</h3>
              <div className="payment-methods">
                <label className={paymentForm.method === 'online' ? 'selected-payment' : ''}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentForm.method === 'online'}
                    onChange={() => setPaymentForm({ ...paymentForm, method: 'online' })}
                  />
                  Pagar en línea
                </label>
                <label className={paymentForm.method === 'local' ? 'selected-payment' : ''}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentForm.method === 'local'}
                    onChange={() => setPaymentForm({ ...paymentForm, method: 'local' })}
                  />
                  Pagar en establecimiento
                </label>
              </div>

              <div className="form-group">
                <label>Número de tarjeta</label>
                <input
                  type="text"
                  className="form-input"
                  value={paymentForm.card}
                  onChange={(event) => setPaymentForm({ ...paymentForm, card: event.target.value })}
                  placeholder="1234-1234-1234-1234"
                />
              </div>
              <div className="form-row">
                <div className="form-group half">
                  <label>Expira</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentForm.exp}
                    onChange={(event) => setPaymentForm({ ...paymentForm, exp: event.target.value })}
                    placeholder="MM/AA"
                  />
                </div>
                <div className="form-group half">
                  <label>CVC</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentForm.cvc}
                    onChange={(event) => setPaymentForm({ ...paymentForm, cvc: event.target.value })}
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            <div className="selection-box payment-summary">
              <h3>RESUMEN DE COMPRA</h3>
              <div className="summary-list">
                <p><strong>Servicio:</strong> {pendingReservation?.serviceName || selectedService.name}</p>
                <p><strong>Fecha:</strong> {pendingReservation?.date || bookingForm.date}</p>
                <p><strong>Hora:</strong> {pendingReservation?.time || bookingForm.time}</p>
                <p><strong>Especialista:</strong> {pendingReservation?.specialist || bookingForm.specialist}</p>
                <hr />
                <p><strong>Total:</strong> ${pendingReservation?.price || selectedService.price}.00</p>
                <p className="payment-total"><strong>Anticipo:</strong> $10.00</p>
              </div>
              <button className="btn-primary payment-submit" type="submit">Pagar y confirmar</button>
            </div>
          </form>
        </main>
      )}

      {currentView === 'admin' && (
        <div className="admin-layout">
          <aside className="sidebar">
            <h3>Aesthetica Admin</h3>
            <ul className="sidebar-menu">
              <li className="active">Dashboard</li>
              <li>Citas</li>
              <li>Servicios</li>
              <li>Personal</li>
            </ul>
            <button className="btn-secondary sidebar-logout" onClick={logout}>Cerrar sesión</button>
          </aside>

          <main className="admin-content">
            <header className="admin-header">
              <h2>Panel de administración</h2>
              <div>Bienvenido, {currentUser?.name}</div>
            </header>

            <div className="metrics-grid">
              <div className="metric-card">
                <div>Citas confirmadas</div>
                <div className="metric-value">{dashboardStats.confirmed}</div>
              </div>
              <div className="metric-card">
                <div>Ingresos</div>
                <div className="metric-value">${dashboardStats.totalRevenue}.00</div>
              </div>
              <div className="metric-card">
                <div>Pendientes</div>
                <div className="metric-value">{dashboardStats.pending}</div>
              </div>
            </div>

            <div className="admin-panels">
              <div className="selection-box chart-box">
                <h3>RENDIMIENTO DE SERVICIOS</h3>
                <div className="chart-wrapper">
                  <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className="selection-box table-box">
                <h3>CRUD DE SERVICIOS</h3>
                <form onSubmit={handleServiceSubmit} className="service-form">
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Nombre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={serviceForm.name}
                        onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                      />
                    </div>
                    <div className="form-group half">
                      <label>Precio</label>
                      <input
                        type="number"
                        className="form-input"
                        value={serviceForm.price}
                        onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Duración</label>
                      <input
                        type="text"
                        className="form-input"
                        value={serviceForm.duration}
                        onChange={(event) => setServiceForm({ ...serviceForm, duration: event.target.value })}
                      />
                    </div>
                    <div className="form-group half">
                      <label>Descripción</label>
                      <input
                        type="text"
                        className="form-input"
                        value={serviceForm.description}
                        onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">
                    {editingServiceId ? 'Guardar cambios' : 'Añadir servicio'}
                  </button>
                </form>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Precio</th>
                      <th>Tiempo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td>{service.name}</td>
                        <td>${service.price}.00</td>
                        <td>{service.duration}</td>
                        <td className="actions-cell">
                          <button className="btn-secondary small" onClick={() => handleEditService(service)}>Editar</button>
                          <button className="btn-primary small danger" onClick={() => handleDeleteService(service.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
