import { Message } from '@twilio/conversations';
import { FhirClient } from '@zapehr/sdk';
import { Appointment } from 'fhir/r4';
import { AppointmentInformation } from '../types/types';
import { getPatchOperationsToUpdateVisitStatus } from './visitMappingUtils';

export const classifyAppointments = (appointments: AppointmentInformation[]): Map<any, any> => {
  const statusCounts = new Map();

  appointments.forEach((appointment) => {
    const { status } = appointment;
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
  });

  return statusCounts;
};

export const messageIsFromPatient = (message: Message): boolean => {
  return message.author?.startsWith('+') ?? false;
};

export const checkinPatient = async (fhirClient: FhirClient, appointmentId: string): Promise<void> => {
  const appointmentToUpdate = await fhirClient.readResource<Appointment>({
    resourceType: 'Appointment',
    resourceId: appointmentId,
  });
  const statusOperations = getPatchOperationsToUpdateVisitStatus(appointmentToUpdate, 'ARRIVED');

  await fhirClient.patchResource({
    resourceType: 'Appointment',
    resourceId: appointmentId,
    operations: [
      {
        op: 'replace',
        path: '/status',
        value: 'arrived',
      },
      ...statusOperations,
    ],
  });
};
