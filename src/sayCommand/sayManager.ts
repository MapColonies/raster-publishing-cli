import { singleton } from 'tsyringe';

@singleton()
export class SayManager {
  public say(word: string): void {
    console.log(word);
  }
}
