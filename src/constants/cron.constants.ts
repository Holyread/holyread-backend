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
          Hours: '12', //12 PM
          DayOfMonth: '*/4',
          Months: '*',
          DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
}
  
export const engagementMotivation = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '18', // 6 PM
          DayOfMonth: '*',
          Months: '*',
          DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const unfinishedBookNotifier = {
      SCHEDULE: {
        Minutes: '0',
        Hours: '10', // Daytime hours (10AM)
        DayOfMonth: '*/4', // Every 4 days
        Months: '*',
        DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const highlightAndQuoteFeature = {
      SCHEDULE: {
        Minutes: '0',
        Hours: '14', // Daytime hours (2pm)
        DayOfMonth: '*/4', // Every 4 days
        Months: '*',
        DayOfWeek: '*',
      },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

  export const kindleEmailNotifier = {
      SCHEDULE: {
            Minutes: '0',
            Hours: '16', // Daytime hours (4pm)
            DayOfMonth: '*/4', // Every 4 days
            Months: '*',
            DayOfWeek: '*',
          },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
};

export const schedulePersonalizeNotification = {
      SCHEDULE: {
          Minutes: '0',
          Hours: '9-18', // Daytime hours (9 AM to 6 PM)
          DayOfMonth: '3,6', // On the 3rd and 6th day
          Months: '*', // Every month
          DayOfWeek: '*', // Every day of the week
         },
      JOBRESTRICTENV: ['local'], // 'local','development','production'
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
