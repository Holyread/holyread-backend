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
          Hours: '12',
          DayOfMonth: '*',
          Months: '*',
          DayOfWeek: '2,5',
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
