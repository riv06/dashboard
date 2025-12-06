-- Drop existing tables if they exist
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bus_sections CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS company_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;

-- Create super_admins table
CREATE TABLE super_admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  commission_percentage DECIMAL(5,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create company_users table
CREATE TABLE company_users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create buses table
CREATE TABLE buses (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  bus_number VARCHAR(50) NOT NULL,
  plate_number VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tickets table
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  route_id INTEGER REFERENCES routes(id),
  bus_id INTEGER REFERENCES buses(id),
  driver_id INTEGER REFERENCES drivers(id),
  passenger_name VARCHAR(255) NOT NULL,
  seat_number INTEGER CHECK (seat_number >= 1 AND seat_number <= 40),
  price DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0.00,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  travel_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed'
);

-- Create bus_sections table
CREATE TABLE bus_sections (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
  section_name VARCHAR(100) NOT NULL,
  seat_start INTEGER NOT NULL,
  seat_end INTEGER NOT NULL,
  CONSTRAINT valid_seats CHECK (seat_start >= 1 AND seat_end <= 40 AND seat_start <= seat_end)
);

-- Create indexes for better performance
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_buses_company ON buses(company_id);
CREATE INDEX idx_drivers_company ON drivers(company_id);
CREATE INDEX idx_routes_company ON routes(company_id);
CREATE INDEX idx_tickets_company ON tickets(company_id);
CREATE INDEX idx_tickets_date ON tickets(travel_date);
CREATE INDEX idx_bus_sections_bus ON bus_sections(bus_id);

COMMENT ON TABLE super_admins IS 'Super administrator accounts for portal management';
COMMENT ON TABLE companies IS 'Bus companies registered in the system';
COMMENT ON TABLE company_users IS 'Multiple users per company with different roles';
COMMENT ON TABLE buses IS 'Bus fleet - all buses have 40 passenger capacity';
COMMENT ON TABLE drivers IS 'Driver information for each company';
COMMENT ON TABLE routes IS 'Bus routes managed by companies';
COMMENT ON TABLE tickets IS 'Ticket sales with commission tracking';
COMMENT ON TABLE bus_sections IS 'Seat layout sections for buses (40 seats per bus)';
