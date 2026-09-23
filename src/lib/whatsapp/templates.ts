export function buildConfirmationMessage(
  customerName: string, 
  serviceName: string, 
  barberName: string, 
  date: string, 
  time: string, 
  shopAddress: string
) {
  return [
    { type: 'text', text: customerName },
    { type: 'text', text: serviceName },
    { type: 'text', text: barberName },
    { type: 'text', text: date },
    { type: 'text', text: time },
    { type: 'text', text: shopAddress }
  ];
}

export function buildReminderMessage(
  customerName: string, 
  serviceName: string, 
  barberName: string, 
  date: string, 
  time: string
) {
  return [
    { type: 'text', text: customerName },
    { type: 'text', text: serviceName },
    { type: 'text', text: barberName },
    { type: 'text', text: date },
    { type: 'text', text: time }
  ];
}

export function buildCancellationMessage(customerName: string, date: string, time: string) {
  return [
    { type: 'text', text: customerName },
    { type: 'text', text: date },
    { type: 'text', text: time }
  ];
}

export function buildRescheduleMessage(
  customerName: string, 
  newDate: string, 
  newTime: string, 
  barberName: string
) {
  return [
    { type: 'text', text: customerName },
    { type: 'text', text: newDate },
    { type: 'text', text: newTime },
    { type: 'text', text: barberName }
  ];
}
