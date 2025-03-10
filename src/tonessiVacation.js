import moment from 'moment';

/**
 * Класс для расчета времени до отпуска Тонесси
 */
class TonessiVacation {
  /**
   * Проверяет и возвращает количество оставшихся дней и часов до начала отпуска
   * @return {Object} - Объект с двумя свойствами:
   *   - hoursLeft {number} - Количество оставшихся часов до начала отпуска
   *   - daysLeft {number} - Количество оставшихся дней до начала отпуска
   */
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
