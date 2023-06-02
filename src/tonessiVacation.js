import moment from 'moment';

class TonessiVacation {
  check() {
    this.currentDate = moment([2023, 6, 4, 12, 0, 0]);
    this.vacationDate = moment([2023, 6, 18, 13, 0, 0]);
    return this.vacationDate.diff(this.currentDate, 'days');
  }
}

export const tonessiVacation = new TonessiVacation();
