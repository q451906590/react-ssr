import React from 'react';
interface State {
  error: boolean
}
class AppError extends React.Component {
  public readonly state: Readonly<State> = { error: false };
  constructor(props:any) {
    super(props);
  }
  componentDidCatch(error:object, info:object) {
    this.setState({ error, info });
  }
  render() {
    const {error} = this.state;
    if (this.state.error) {
      return <h1>Error: {this.state.error.toString()}</h1>;
    }
    return this.props.children;
  }
}

export default AppError;
