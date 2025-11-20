# Helpdesk Antares - Sistema de Gestión de Tickets

Sistema completo de gestión de tickets (Helpdesk) desarrollado con Next.js 13+, TypeScript, Supabase y Redux.

## 🚀 Características Principales

### Portal de Clientes
- ✅ Registro e inicio de sesión con Supabase Auth
- ✅ Creación de tickets con categorías y prioridades
- ✅ Visualización de tickets propios (abiertos y cerrados)
- ✅ Sistema de mensajería en tiempo real dentro de los tickets
- ✅ Dashboard con estadísticas personales

### Portal de Administración
- ✅ Gestión completa de todos los tickets
- ✅ Asignación de tickets a agentes
- ✅ Cambio de estado de tickets (abierto, pendiente, cerrado)
- ✅ Dashboard con métricas y estadísticas
- ✅ Gestión de categorías
- ✅ Visualización de todos los clientes

### Portal de Asistentes
- ✅ Visualización de tickets asignados
- ✅ Respuesta a tickets de clientes
- ✅ Cierre de tickets resueltos
- ✅ Gestión de categorías

## 🛠️ Tecnologías

**Frontend:**
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Redux Toolkit
- React Hook Form
- React Icons

**Backend/Database:**
- Supabase (PostgreSQL + Auth + Real-time)
- Supabase Auth para autenticación
- Supabase Database para almacenamiento

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/GaboGuade/proyecto-gabriel.git
cd proyecto-gabriel
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. **Configurar la base de datos en Supabase**

Ejecuta los siguientes SQL en el SQL Editor de Supabase:

```sql
-- Tabla de perfiles de usuario
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'assistance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category_id INTEGER REFERENCES categories(id),
  assigned_to UUID REFERENCES auth.users(id),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mensajes
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para tickets
CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'assistance'))
);
CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update tickets" ON tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'assistance'))
);

-- Políticas RLS para messages
CREATE POLICY "Users can view messages of their tickets" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'assistance'))
);
CREATE POLICY "Users can create messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

5. **Crear un trigger para crear perfil automáticamente**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

6. **Ejecutar el proyecto**

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
proyecto-gabriel/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de registro
│   │   ├── support-center/    # Dashboard principal
│   │   │   ├── create-ticket/ # Crear ticket
│   │   │   ├── open-tickets/  # Tickets abiertos
│   │   │   └── close-tickets/ # Tickets cerrados
│   │   └── page.tsx           # Página principal
│   ├── components/            # Componentes reutilizables
│   ├── services/              # Servicios de Supabase
│   ├── redux/                 # Store de Redux
│   ├── lib/                   # Configuración (Supabase client)
│   └── types/                 # Tipos TypeScript
├── public/                    # Archivos estáticos
└── package.json
```

## 🔐 Roles de Usuario

- **customer**: Cliente que puede crear y ver sus propios tickets
- **admin**: Administrador con acceso completo al sistema
- **assistance**: Asistente que puede gestionar tickets asignados

## 🎯 Funcionalidades Implementadas

✅ Autenticación completa con Supabase
✅ Creación y gestión de tickets
✅ Sistema de mensajería en tickets
✅ Dashboard con estadísticas
✅ Asignación de tickets a agentes
✅ Filtros y búsqueda de tickets
✅ Gestión de categorías
✅ Roles y permisos
✅ Interfaz responsive con Tailwind CSS

## 📝 Notas

- Este proyecto usa Supabase como backend completo (base de datos + autenticación)
- No se requiere servidor backend adicional
- Todas las operaciones se realizan directamente desde el cliente usando Supabase Client

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es para uso académico (Tesis).

---

Desarrollado con ❤️ para Helpdesk Antares

User Mind Map: <Link>

## **1. Front-end Development:**

### **Technologies:**

**React:** A JavaScript library for building user interfaces.

**Next.js:** A framework for server rendered React applications.

**Tailwind CSS:** A utility-first CSS framework for building responsive designs.

**Redux:** A state management library for managing the global state of the application.

## **2. Back-end Development:**

### **Technologies:**

**Node.js:** A JavaScript runtime for server-side development.Nest.js: A progressive Node.js framework for building scalable applications.

**Prisma:** A modern database toolkit and ORM.

**PostgreSQL:** A powerful open-source relational database.



# Project Features 

### **Customer Portal**

- Customers can create an account or log in to the system.
    - Register
    - Sign in!
    - Email validation after register.
    - forget password.
    - google login.
    - Facebook login
- Customers can submit problems, providing a description and selecting a problem type from a predefined list or choosing “Other” for unspecified issues.
- Customer can view a dashboard displaying a list of problems / unresolved / resolved.
- Customer can filter and sort problems based on different parameters such as status, priority.

### **Admin Portal**

- Admins can log in using their credentials.
- Admins can view a dashboard displaying a list of unresolved problems, categorized by type.
- Admins can filter and sort problems based on different parameters such as status, priority.
- Admins can assign problems to specific admins based on their expertise (admin specialization).

### **Assistant Specialization**

- Each a**ssistant** has a specialized problem type they are responsible for.
- An a**ssistant** can only receive problems that match their specialization.

### **Problem Handling**

- a**ssistant and admin** can open a problem to view its details and history.
- a**ssistant and admin** can send replies to customers’ problem reports, providing updates or solutions.
- Customers receive reply to notifications when a**ssistant and admin** reply to their problems.
- Customers can reply to admin messages to provide feedback or ask further questions.

### **Feedback Loop**

- After the problem is resolved, customers can provide feedback on the overall support experience.
- Admins can view and respond to customer feedback.

## Project Ui And Features

- First Landing Page: 

    ![laptop](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/0108ea35-e2de-431d-9e0b-8e6bcf3a9430)
--

- After Customer or Clinet Login -- Dashboard
  
    ![dashboard](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/8a370285-dfb4-4b10-a458-5a9aaae42333)
--

- User Can Create or Open a support tickets
  
    ![create ticket](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/097b1cfe-d037-4be2-a527-e662e3c45275)
--

- User can see ticket details info and can reply to admin or assistant.

   ![ticket-details](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/910261c0-733c-471e-a46a-c301252fbfa3)
--

- Admin Can see all customer or client tickets.
  
   ![admin-see-all-tickets](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/d63da2c3-c994-4a1c-8df9-717bcaa903de)
--

- Admin can create new assistant roll and setup category.
  
   ![admin-can set assistant](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/ff2d9e71-62f6-4126-afbc-e2bd62d85793)
--

- Assistant can see their own category customer tickets. and can reply and resolve it.

  ![assistant](https://github.com/morshedulmunna/support-ticket-web/assets/44342051/688828f5-aa93-4ded-94e6-e7086e3be308)
--


Develop by morshedulmunna1@gmail.com

Email: morshedulmunna1@gmail.com

phone: +8801764807776 (call or whatsapp)

website: https://morshedulmunna.vercel.app/
