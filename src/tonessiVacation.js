import moment from 'moment';

class TonessiVacation {
  constructor() {
    this.currentDate = moment();
    this.vacationDate = moment([2023, 4, 30, 13, 0, 0]);
  }

  check() {
    return Math.abs(this.currentDate.diff(this.vacationDate, 'days'));
  }
}

export const tonnesiVacation = new TonessiVacation();
