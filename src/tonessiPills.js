import moment from 'moment';
import {TONESSI_PILLS_END} from './constants.js';

class TonessiPills {
  parsePillsList() {
    this.ecoclav = 10;
    this.ketoprofen = 5;
    this.malavitLevopront = 7;
    this.linebact = 32;
    this.vitaminC = 32;

    // this.currentDate = moment();
    this.currentDate = moment([2023, 5, 4, 21, 0, 0]);
    this.startDate = moment([2023, 4, 24, 8, 0, 0]);
    this.currentHours = this.currentDate.hour();
    this.currentMinutes = this.currentDate.minute();

    /**
     * Morning
     */
    /**
     * 9 am
     */
    this.morningNumeration = 1;

    if (
      this.currentDate.diff(this.startDate, 'days') <= 10 ||
      (
        this.currentDate.diff(this.startDate, 'days') > 30 &&
        this.currentDate.diff(this.startDate, 'days') <= 40
      ) ||
      (
        this.currentDate.diff(this.startDate, 'days') > 60 &&
        this.currentDate.diff(this.startDate, 'days') <= 70
      )
    ) {
      this.MORNING = `${this.morningNumeration}. *Исмиген* (иммунное) 
_1 таблетка под язык натощак, за 30 минут до завтрака_\n\n`;
      this.morningNumeration++;
    }

    if (this.currentDate.diff(this.startDate, 'days') <= this.ecoclav) {
      if (this.MORNING === undefined) {
        this.MORNING = `${this.morningNumeration}. *Экоклав* (антибиотик)
_1 таблетка (следующая через 12 часов)_\n\n`;
      } else {
        this.MORNING += `${this.morningNumeration}. *Экоклав* (антибиотик)
_1 таблетка (следующая через 12 часов)_\n\n`;
      }
      this.morningNumeration++;
    }

    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      this.MORNING += `${this.morningNumeration}. *Левопронт* (полоскание)
_10 мл/0,5 стакана воды_
_(Следующий через 6 часов)_\n\n`;
      this.morningNumeration++;
    }

    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      this.MORNING += `${this.morningNumeration}. *Малавит* (полоскание)
_20 капель/1 стакан воды_`;
    }

    /**
     * Day
     */
    /**
     * 12 pm
     */
    if (
      this.currentDate.diff(this.startDate, 'days') <= this.linebact
    ) {
      this.DAY_12_00 = `1. *Линебакт* (Прибиотик) 
_1 таблетка перед/во время еды_`;
    }

    /**
     * 12:30 pm
     */
    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      this.DAY_12_30 = `2. *Малавит* (полоскание)
_20 капель/1 стакан воды_`;
    }

    /**
     * 2:30 pm
     */
    if (this.currentDate.diff(this.startDate, 'days') <= this.ketoprofen) {
      this.DAY_14_30 = `3. *Кетопрофен* (полоскание) 
_10 мл/200 мл воды_`;
    }

    /**
     * 3:30 pm
     */
    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      this.DAY_15_30 = `4. *Левопронт* (полоскание) 
_10 мл/0,5 стакана воды 
(Следующий через 6 часов)_`;
    }

    /**
     * Evening
     */
    this.eveningNumeration = 1;

    /**
     * 6 pm
     */
    if (
      this.currentDate.diff(this.startDate, 'days') <= this.vitaminC
    ) {
      this.EVENING_18 = `${this.eveningNumeration}. *Витамин C*\n\n`;
    }
    this.eveningNumeration++;

    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      if (this.EVENING_18 === undefined) {
        this.EVENING_18 = `${this.eveningNumeration}. *Малавит* (полоскание)
_20 капель/1 стакан воды_`;
      } else {
        this.EVENING_18 += `${this.eveningNumeration}. *Малавит* (полоскание)
_20 капель/1 стакан воды_`;
      }
      this.eveningNumeration++;
    }

    /**
     * 7 pm
     */
    if (this.currentDate.diff(this.startDate, 'days') <= this.ketoprofen) {
      this.EVENING_19 = `${this.eveningNumeration}. *Кетопрофен* (полоскание) 
_10 мл/200 мл воды_`;
      this.eveningNumeration++;
    }

    /**
     * 8 pm
     */
    if (
      this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront
    ) {
      this.EVENING_20 = `${this.eveningNumeration}. *Левопронт* (полоскание) 
_10 мл/0,5 стакана воды 
(Следующий через 6 часов)_\n\n`;
      this.eveningNumeration++;
    }

    if (this.currentDate.diff(this.startDate, 'days') <= this.ecoclav) {
      if (this.EVENING_20 === undefined) {
        this.EVENING_20 = `${this.eveningNumeration}. *Экоклав* (антибиотик)
_1 таблетка через 12 часов от предыдущей_`;
      } else {
        this.EVENING_20 += `${this.eveningNumeration}. *Экоклав* (антибиотик)
_1 таблетка через 12 часов от предыдущей_`;
      }
    }

    /**
     * IF block
     */
    if (
      this.currentHours === 9 &&
      this.currentMinutes === 0 &&
      (
        this.currentDate.diff(this.startDate, 'days') <= 10 ||
        (
          this.currentDate.diff(this.startDate, 'days') > 30 &&
          this.currentDate.diff(this.startDate, 'days') <= 40
        ) ||
        (
          this.currentDate.diff(this.startDate, 'days') > 60 &&
          this.currentDate.diff(this.startDate, 'days') <= 70
        )
      )
    ) {
      return this.MORNING;
    } else if (
      this.currentHours === 12 &&
      this.currentMinutes === 0 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.linebact)
    ) {
      return this.DAY_12_00;
    } else if (
      this.currentHours === 12 &&
      this.currentMinutes === 30 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront)
    ) {
      return this.DAY_12_30;
    } else if (
      this.currentHours === 14 &&
      this.currentMinutes === 30 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.ecoclav) &&
      (this.currentDate.diff(this.startDate, 'days') <= this.ketoprofen)
    ) {
      return this.DAY_14_30;
    } else if (
      this.currentHours === 15 &&
      this.currentMinutes === 30 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront)
    ) {
      return this.DAY_15_30;
    } else if (
      this.currentHours === 18 && this.currentMinutes === 0 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.vitaminC) &&
      (this.currentDate.diff(this.startDate, 'days') <= this.malavitLevopront)
    ) {
      return this.EVENING_18;
    } else if (
      this.currentHours === 19 &&
      this.currentMinutes === 0 &&
      (this.currentDate.diff(this.startDate, 'days') <= this.ketoprofen)
    ) {
      return this.EVENING_19;
    } else if (
      this.currentHours === 21 &&
      this.currentMinutes === 0 &&
      (
        (this.currentDate.diff(
            this.startDate,
            'days',
        ) <= this.malavitLevopront) ||
        (this.currentDate.diff(
            this.startDate,
            'days',
        ) <= this.ecoclav)
      )
    ) {
      return this.EVENING_20;
    } else if (this.currentDate.diff(this.startDate, 'days') === 71) {
      return TONESSI_PILLS_END;
    } else {
      return 'Никакие лекарства не нужно принимать на это время! 🤗';
    }
  }
}

export const tonessiPills = new TonessiPills();
