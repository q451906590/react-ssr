import React from 'react';
import { Button } from 'antd';
import { connect } from 'react-redux';
// import serviceStore from '../../store/serviceStore';
class Hello extends React.Component {
  public static init(store: any) {
    return store.dispatch.Hello.incrementAsync(4);
  }
  constructor(props:any) {
    super(props);

    this.state = {
      error: { msg: 'Errored' },
    };
  }
  componentDidMount() {
    const { incrementAsync }:any = this.props;
    incrementAsync(4);
  }
  render() {
    const {count}:any = this.props;
    return (
      <div>
        <Button type='primary'>Primary</Button>
        {count}
      </div>
    );
  }
}
const mapStateToProps = (state:any) => {
  return {
    count: state.Hello.count
  };
};

const mapDispatchToProps = (dispatch:any) => ({
  incrementAsync: dispatch.Hello.incrementAsync
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Hello);
