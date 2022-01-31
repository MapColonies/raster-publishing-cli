import { singleton } from 'tsyringe';

@singleton()
export class HelloWorldManager {
  public sayHello(): void {
    console.log('hello world');
  }
}
