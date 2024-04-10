export const readsOfDayDisplayAt = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '1',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const dailyDevotional = {
      SCHEDULE: {
            Minutes: '*',
            Hours: '*',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const publishContent = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '1',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '2,5',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const renewalReminder = {
      SCHEDULE: {
            Minutes: '30',
            Hours: '1',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local', 'development', 'production'], // 'local','development','production'
}

export const syncProfits = {
      SCHEDULE: {
            Minutes: '30',
            Hours: '*',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const setStripeCouponAndStatus = {
      SCHEDULE: {
            Minutes: '*/1',
            Hours: '*',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const contentUpdateAlert = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '8',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '2,5',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const engagementMotivation = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '10',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const unfinishedBookNotifier = {
      SCHEDULE: {
        Minutes: '0',
        Hours: '9-18', // Daytime hours (9 AM to 6 PM)
        DayOfMonth: '*/4', // Every 4 days
        Months: '*',
        DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};
