import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';

export const formatMessageTime = (date) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return `Yesterday ${format(messageDate, 'HH:mm')}`;
  } else {
    return format(messageDate, 'dd/MM/yyyy HH:mm');
  }
};

export const formatChatTime = (date) => {
  const messageDate = new Date(date);
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else {
    return format(messageDate, 'dd/MM/yyyy');
  }
};

export const formatLastSeen = (date) => {
  const lastSeenDate = new Date(date);
  const now = new Date();
  const minutesAgo = differenceInMinutes(now, lastSeenDate);

  if (minutesAgo < 1) {
    return 'just now';
  } else if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
  } else if (isToday(lastSeenDate)) {
    return `today at ${format(lastSeenDate, 'HH:mm')}`;
  } else if (isYesterday(lastSeenDate)) {
    return `yesterday at ${format(lastSeenDate, 'HH:mm')}`;
  } else {
    return format(lastSeenDate, 'dd/MM/yyyy HH:mm');
  }
};
