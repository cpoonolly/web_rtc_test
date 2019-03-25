import React, { Component } from 'react';

// material-ui
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Icon from '@material-ui/core/Icon';

// web rtc stuff
import WebRTCVideo from '../components/WebRTCVideo';
import WebRTCControlPanel from '../components/WebRTCControlPanel';
import WebRTCConnectionManager from '../connectionManagers/WebRTCConnectionManager';

const DEFAULT_SOCKET_URL = 'http://localhost:8080';

const styles = ((theme) => ({
  uiContainer: {
    height: '100%',
    padding: '100px',
  },
  doublePadded: {
    padding: theme.spacing.unit * 2,
  }
}));

class WebRTCWithServerTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
      serverUrl: DEFAULT_SOCKET_URL,
      isServerSet: false
    };

    this.controlPanel = {
      buttons: [
        {id: 'call_start', render: () => this.renderCallBtn(), onClick: () => this.handleCallStart()},
        {id: 'call_end', render: () => this.renderEndCallBtn(), onClick: () => this.handleCallEnd()},
      ]
    };

    this.rtcConnectionMngr = null;

    // since we're using MediaStream objects need to store these as members and user refs to set the video src's
    this.localVideoStream = null;
    this.localVideoEl = null;
    
    this.remoteVideoStream = null;
    this.remoteVideoEl = null;

    this.handleCallStart = this.handleCallStart.bind(this);
    this.handleCallEnd = this.handleCallEnd.bind(this);
    this.handleServerUrlChange = this.handleServerUrlChange.bind(this);
    this.handleSetServerClick = this.handleSetServerClick.bind(this);

    this.setLocalVideoEl = this.setLocalVideoEl.bind(this);
    this.setRemoteVideoEl = this.setRemoteVideoEl.bind(this);
  }

  handleServerUrlChange(newText) {
    this.setState({serverUrl: newText});
  }

  handleSetServerClick() {
    this.rtcConnectionMngr = new WebRTCConnectionManager(this.state.serverUrl);
    this.setState({isServerSet: true});
  }

  handleCallStart() {
    console.log('Call Started!');

    this.rtcConnectionMngr.call();
  }

  handleCallEnd() {
    console.log('Call Ended!');

    console.log('...no it didn\'t...');
  }

  setLocalVideoEl(el) {
    this.localVideoEl = el;

    this.rtcConnectionMngr.getLocalMediaStream()
      .then((mediaStream) => this.localVideoStream = mediaStream)
      .then(() => this.localVideoEl.srcObject = this.localVideoStream);
  }

  setRemoteVideoEl(el) {
    this.remoteVideoEl = el;

    this.rtcConnectionMngr.getRemoteMediaStream()
      .then((mediaStream) => this.remoteVideoStream = mediaStream)
      .then(() => this.remoteVideoEl.srcObject = this.remoteVideoStream);
  }

  renderCallBtn() {
    return (<React.Fragment>Call <Icon style={{marginLeft: '15px'}}>call</Icon></React.Fragment>);
  }

  renderEndCallBtn() {
    return (<React.Fragment>End Call <Icon style={{marginLeft: '15px'}}>call_end</Icon></React.Fragment>);
  }

  renderSetServerUI() {
    const { classes } = this.props;

    return (
      <Grid container spacing={12} className={classes.uiContainer} justify="center" alignItems="stretch">
        <Grid item xs={4}>
          <TextField
            label="Server Url"
            fullWidth
            value={this.state.serverUrl}
            onChange={(event) => this.handleServerUrlChange(event.target.value)}
          />
        </Grid>
        <Grid item xs={4} className={classes.doublePadded}>
          <Button variant="contained" color="primary" onClick={this.handleSetServerClick}>Connect</Button>
        </Grid>
      </Grid>
    );
  }

  renderVideoChatUI() {
    const { classes } = this.props;

    return (
      <div className={classes.uiContainer}>
        <Grid container spacing={12} justify="center" alignItems="stretch">
          <Grid item xs={6} className={classes.doublePadded}>
            <WebRTCVideo videoName="Local" videoRef={this.setLocalVideoEl}/>
          </Grid>
          <Grid item xs={6} className={classes.doublePadded}>
            <WebRTCVideo videoName="Remote" videoRef={this.setRemoteVideoEl}/>
          </Grid>
        </Grid>
        <Grid container spacing={12} justify="center" className={classes.doublePadded}>
          <Grid item xs={6}>
            <WebRTCControlPanel controlPanel={this.controlPanel}></WebRTCControlPanel>
          </Grid>
        </Grid>
      </div>
    );
  }

  render() {
    return (!this.state.isServerSet ? this.renderSetServerUI() : this.renderVideoChatUI());
  }
}

export default withStyles(styles)(WebRTCWithServerTab);
