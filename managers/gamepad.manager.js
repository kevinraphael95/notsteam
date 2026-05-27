export class GamepadManager {

  constructor() {

    this.connected = false;

    this.bind();
  }

  bind() {

    window.addEventListener(
      'gamepadconnected',
      this.onConnect.bind(this)
    );

    window.addEventListener(
      'gamepaddisconnected',
      this.onDisconnect.bind(this)
    );
  }

  onConnect(event) {

    this.connected = true;

    console.log(
      'Gamepad connected:',
      event.gamepad.id
    );
  }

  onDisconnect() {

    this.connected = false;
  }

  getGamepads() {
    return navigator.getGamepads();
  }
}
