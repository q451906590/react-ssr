import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import withStyles from 'isomorphic-style-loader/withStyles';
import style from './Home.scss';

@withStyles(style)
class Home extends React.Component {
  public static init(store:any) {
    return store.dispatch.Home.incrementAsync(5);
  }
  constructor(props:any) {
    super(props);

    this.state = {
      error: { msg: 'Errored' },
    };
  }
  componentDidMount() {
    const { incrementAsync }:any = this.props;
    incrementAsync(5);
  }
  render() {
    const {count}:any = this.props;
    return (
      <div>
        <Link to='/Hello'>
          Hello
        </Link>
        {count}
      </div>
    );
  }
}
const mapStateToProps = (state:any) => {
  return {
    count: state.Home.count
  };
};

const mapDispatchToProps = (dispatch:any) => ({
  incrementAsync: dispatch.Home.incrementAsync
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
