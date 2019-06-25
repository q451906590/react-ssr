import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
// import HeadMenu from '../Public/HeadMenu/HeadMenu';
import withStyles from 'isomorphic-style-loader/withStyles';
import style from './Test.css';
import PropTypes from 'prop-types';
import StyleContext from 'isomorphic-style-loader/StyleContext';
@withStyles(style)
class Home extends React.Component {
  // public static init(store:any) {
  //   return store.dispatch.Home.incrementAsync(5);
  // }
  constructor(props:any, context:any) {
    super(props);
    this.state = {
      error: { msg: 'Errored' },
    };
  }
  // componentDidMount() {
  //   const { incrementAsync }:any = this.props;
  //   incrementAsync(5);
  // }
  // 在子组件中用于说明context接收的数据类型
  render() {
    // const {count}:any = this.props;
    return (
      <div className={style.title}>
        Hello
      </div>
    );
  }
}
// const mapStateToProps = (state:any) => {
//   return {
//     count: state.Home.count
//   };
// };

// const mapDispatchToProps = (dispatch:any) => ({
//   incrementAsync: dispatch.Home.incrementAsync
// });
// export default connect(
//   mapStateToProps,
//   mapDispatchToProps
// )(Home);
export default Home;
