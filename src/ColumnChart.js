export class ColumnChart {
  constructor() {
    this.name = "Bob";
    console.log("Bobbed");
  }

  data(data) {
    this.data = data;
    return this;
  }

  element(element) {
    this.element = element;
    return this;
  }

  render() {
    let bob = 1;
    console.log("render()" + bob);
  }

}
