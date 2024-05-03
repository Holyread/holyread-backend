      export const setReadsOfDayDisplayAt = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '1',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}
export const dailyDevotionalNotification = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '8',
          DayOfMonth: '*',
          Months: '*',
          DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const publishContent = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '9',
            DayOfMonth: '*/4',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const renewalReminderNotification = {
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
            Minutes: '*/2',
            Hours: '*',
            DayOfMonth: '*',
            Months: '*',
            DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}

export const contentUpdateNotification = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '10', // 10 AM
          DayOfMonth: '*/7',
          Months: '*',
          DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const engagementMotivationNotification = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '8', // 8AM
          DayOfMonth: '*/7', //Every seven days
          Months: '*',
          DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const unfinishedBookNotification = {
      SCHEDULE: {
        Minutes: '0',
        Hours: '10', // Daytime hours (10AM)
        DayOfMonth: '*/4', // Every 4 days
        Months: '*',
        DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const highlightAndQuoteFeatureNotification = {
      SCHEDULE: {
        Minutes: '0',
        Hours: '14', // Daytime hours (2pm)
        DayOfMonth: '*/4', // Every 4 days
        Months: '*',
        DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local', 'development', 'production'], // 'local','development','production'
};

  export const kindleSetUpNotification = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '16', // Daytime hours (4pm)
            DayOfMonth: '*/4', // Every 4 days
            Months: '*',
            DayOfWeek: '*',
          },
      JOBRESTRICTENV: ['local', 'development', 'production'], // 'local','development','production'
};

export const schedulePersonalizeNotification = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '9-18', // Daytime hours (9 AM to 6 PM)
          DayOfMonth: '3,6', // On the 3rd and 6th day
          Months: '*', // Every month
          DayOfWeek: '*', // Every day of the week
         },
      JOBRESTRICTENV: ['local', 'development', 'production'], // 'local','development','production'
};

export const publishSmallGroup = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '9-18', // Daytime hours (9 AM to 6 PM)
            DayOfMonth: '*/7', // Every 7 days
            Months: '*',
            DayOfWeek: '*',
          },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const publishCuratedList = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '11', // Daytime hours (11AM)
            // Hours: '9-18', // Daytime hours (9 AM to 6 PM)
            DayOfMonth: '*/4', // Every 4 days
            Months: '*',
            DayOfWeek: '*',
          },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};
