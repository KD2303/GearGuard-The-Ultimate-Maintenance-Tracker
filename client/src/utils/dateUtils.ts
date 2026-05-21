export const getRelativeDateLabel = (dueDate: string | Date): { label: string; colorClass: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  // Using Math.round helps handle daylight saving time changes gracefully
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      label: `(Overdue by ${daysOverdue} day${daysOverdue === 1 ? '' : 's'})`,
      colorClass: 'text-rose-500 dark:text-red-400',
    };
  } else if (diffDays === 0) {
    return {
      label: '(Due today)',
      colorClass: 'text-amber-600 dark:text-amber-400',
    };
  } else if (diffDays === 1) {
    return {
      label: '(Due tomorrow)',
      colorClass: 'text-amber-600 dark:text-amber-400',
    };
  } else {
    return {
      label: `(In ${diffDays} days)`,
      colorClass: 'text-slate-500 dark:text-slate-400',
    };
  }
};
