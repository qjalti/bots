import moment from 'moment';

class TonessiVacation {
  check() {
    this.currentDate = moment();
    this.vacationDate = moment([2023, 6, 18, 13, 0, 0]);
    return {
      hoursLeft: this.vacationDate.diff(this.currentDate, 'hours'),
      daysLeft: this.vacationDate.diff(this.currentDate, 'days'),
    };
  }
}

export const tonessiVacation = new TonessiVacation();
