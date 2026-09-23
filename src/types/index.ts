import { Barber, Service, BarberShift, Appointment, Customer } from '../lib/db/schema';

export type AppointmentStatus = 'pending' | 'confirmed' | 'client_confirmed' | 'in_chair' | 'completed' | 'cancelled' | 'no_show';
export type BookingSource = 'online' | 'walk_in' | 'phone' | 'whatsapp';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BookingFormData {
  customerName: string;
  phone: string;
  email?: string;
  serviceId: string;
  barberId: string;
  date: Date;
  startTime: string; // HH:mm format
  whatsappOptin: boolean;
}

export type BarberWithShifts = Barber & {
  shifts?: BarberShift[];
};

export type ServiceWithBarbers = Service & {
  barbers?: Barber[];
};

export type AppointmentWithDetails = Appointment & {
  barber?: Barber;
  customer?: Customer;
  service?: Service;
};
