import React, { Component } from 'react';

// material-ui
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';

// web rtc stuff
import WebRTCVideo from './WebRTCVideo';
import PigeonRTCConnectionMngr from '../connectionManagers/PigeonRTCConnectionMngr';

const styles = ((theme) => ({
  root: {
    padding: '20px',
  },
  videoChatSection: {
    marginBottom: '30px',
  },
  videoChatContainer: {
    minWidth: `${WebRTCVideo.MIN_WIDTH + 50}px`,
  },
  startOrAcceptFormLabel: {
    marginBottom: '20px',
  },
  offerAnswerInputContainer: {
    width: '100%',
    marginBottom: '30px',
  },
  offerAnswerInput: {
    width: '100%'
  },
  disclaimerContainer: {
    marginTop: '50px',
  },
}));

class WebRTCWithCarrierPigeonTab extends Component {
  constructor(props) {
    super(props);

    this.state = {
      startOrAccept: null,
      isConnected: false,
      localConnectionData: '',
      remoteConnectionData: '',
      showTextCopiedSnackbar: false,
    };

    this.rtcConnectionMngr = new PigeonRTCConnectionMngr();
    this.rtcConnectionMngr.subscribe((localConnectionData) => this.handleLocalConnectionData(localConnectionData));

    // since we're using MediaStream objects need to store these as members and user refs to set the video src's
    this.localVideoStream = null;
    this.localVideoEl = null;
    
    this.remoteVideoStream = null;
    this.remoteVideoEl = null;

    this.setLocalVideoEl = this.setLocalVideoEl.bind(this);
    this.setRemoteVideoEl = this.setRemoteVideoEl.bind(this);
  }

  setLocalVideoEl(el) {
    this.localVideoEl = el;

    this.rtcConnectionMngr.getLocalMediaStream()
      .then((mediaStream) => this.localVideoStream = mediaStream)
      .then(() => {
        if (this.localVideoEl) this.localVideoEl.srcObject = this.localVideoStream;
      });
  }

  setRemoteVideoEl(el) {
    this.remoteVideoEl = el;

    this.rtcConnectionMngr.getRemoteMediaStream()
      .then((mediaStream) => this.remoteVideoStream = mediaStream)
      .then(() => {
        if (this.remoteVideoEl) this.remoteVideoEl.srcObject = this.remoteVideoStream;
      });
  }

  handleLocalConnectionData(localConnectionData) {
    this.setState({localConnectionData});
  }

  handleRemoteConnectionData(remoteConnectionData) {
    this.setState({remoteConnectionData});
  }

  handleStartOrAcceptSelection(startOrAccept) {
    this.setState({startOrAccept});
    if (startOrAccept === 'start') {
      this.rtcConnectionMngr.createOffer();
    }
  }

  handleConnectBtnClick() {
    const remoteConnectionData = JSON.parse(this.state.remoteConnectionData);

    try {
      if (this.state.startOrAccept === 'start') {
        this.rtcConnectionMngr.handleAnswer(remoteConnectionData)
          .then(() => this.setState({isConnected: true}));
      } else if (this.state.startOrAccept === 'accept') {
        this.rtcConnectionMngr.handleOffer(remoteConnectionData)
          .then(() => this.setState({isConnected: true}));
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleLocalConnectionTextFieldClick(event) {
    // Jesus... this is how we need to access the clipboard?
    // https://stackoverflow.com/a/30810322
    // Should probably be using clipboard aAPI instead but i'm a little unclear on it's level of support...
    let tempTextField = document.createElement('textarea');
    tempTextField.innerText = this.state.localConnectionData;
    document.body.appendChild(tempTextField);
    tempTextField.select();
    document.execCommand('copy');
    tempTextField.remove();

    this.setState({showTextCopiedSnackbar: true});
  }

  renderSetupConnectionUI() {
    const { startOrAccept } = this.state;
    const { classes } = this.props;

    return (
      <Grid container direction="column" justify="center" alignItems="center">
        <Grid item>
          {this.renderStartOrAcceptConnectionRadioGroup()}
        </Grid>
        <Grid item className={classes.offerAnswerInputContainer}>
          {startOrAccept && this.renderOfferAnswerFields()}
        </Grid>
        <Grid item>
          {startOrAccept && this.renderConnectBtn()}
        </Grid>
        <Grid item>
          {startOrAccept && this.renderDisclaimer()}
        </Grid>
      </Grid>
    )
  }

  renderStartOrAcceptConnectionRadioGroup() {
    const { startOrAccept } = this.state;
    const { classes } = this.props;

    return (
      <FormControl component="fieldset">
        <FormLabel component="legend" className={classes.startOrAcceptFormLabel}>
          <Typography variant="h5">
            Setup a WebRTC connection via Carrier Pigeon
          </Typography>
          <Typography variant="subtitle1">
            now compatible with smoke signals &amp; messages in a bottle!
          </Typography>
          <Typography variant="caption">
            Note: Connections can be setup via pigeon or like literally anything else...
          </Typography>
        </FormLabel>
        <RadioGroup
          row
          name="start_or_accept"
          value={startOrAccept}
          onChange={(event) => this.handleStartOrAcceptSelection(event.target.value)}
          style={{display: 'flex', justifyContent: 'space-evenly'}}
        >
          <FormControlLabel
            value="start"
            control={<Radio />}
            label="Start a Connection"
            disabled={startOrAccept !== null}
          />
          <FormControlLabel
            value="accept"
            control={<Radio />}
            label="Accept a Connection"
            disabled={startOrAccept !== null}
          />
        </RadioGroup>
      </FormControl>
    );
  }

  // Copy Pasta (sue me..)
  renderDisclaimer() {
    const { classes } = this.props;

    return (
      <div className={classes.disclaimerContainer}>
        <Typography variant="overline">Disclaimer:</Typography>
        <Typography variant="caption" gutterBottom>
          Because each peer only sends one pigeon each, PigeonRTC does not support <a href="http://tools.ietf.org/html/draft-ietf-rtcweb-jsep-03#section-3.4.1">ICE Candidate Trickling</a>.<br/>
          For this and other reasons (namely my crippling inadequacies as an engineer/human being), there's a high likelihood of crappy/failing connections.
        </Typography>
      </div>
    );
  }

  renderConnectBtn() {
    const { startOrAccept, localConnectionData, remoteConnectionData, isConnected } = this.state;
    const { classes } = this.props;

    let isDisabled = true;
    if (startOrAccept === 'start') {
      isDisabled = (!localConnectionData || !remoteConnectionData || isConnected)
    } else if (startOrAccept === 'accept') {
      isDisabled = (!remoteConnectionData || isConnected);
    }

    return (
      <Button
        disabled={isDisabled}
        variant="contained"
        color="primary"
        className={classes.startOrAcceptConnectBtn}
        onClick={() => this.handleConnectBtnClick()}
      >
        Connect
      </Button>
    );
  }

  renderOfferAnswerFields() {
    const { startOrAccept, localConnectionData, remoteConnectionData } = this.state;
    const { classes } = this.props;

    let remoteConnectionTextField = (
      <TextField
        label={'Get this from your friend!'}
        onChange={(event) => this.handleRemoteConnectionData(event.target.value)}
        value={remoteConnectionData}
        multiline
        rows="2"
        margin="normal"
        variant="outlined"
        className={classes.offerAnswerInput}
      />
    );

    let localConnectionTextField = (
      <TextField
        label={'Send this to your friend!'}
        disabled
        value={localConnectionData}
        multiline
        rows="2"
        margin="normal"
        variant="outlined"
        className={classes.offerAnswerInput}
        onClick={(event) => this.handleLocalConnectionTextFieldClick(event)}
      />
    );

    return (
      <Grid container spacing={16} justify="space-evenly">
        <Grid item xs={6}>
          {startOrAccept === 'start' && localConnectionTextField}
          {startOrAccept === 'accept' && remoteConnectionTextField}
        </Grid>
        <Grid item xs={6}>
          {startOrAccept === 'start' && remoteConnectionTextField}
          {startOrAccept === 'accept' && localConnectionData && localConnectionTextField}
        </Grid>
      </Grid>
    );
  }

  renderTextCopiedSnackbar() {
    return (
      <Snackbar
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        open={this.state.showTextCopiedSnackbar}
        onClose={() => this.setState({showTextCopiedSnackbar: false})}
        autoHideDuration={1000}
        ContentProps={{'aria-describedby': 'message-text-copied-id'}}
        message={<span id="message-text-copied-id">Text copied! Now send it to your friend!</span>}
      />
    )
  }

  renderVideoChatUI() {
    const { classes } = this.props;

    return (
      <Grid container spacing={16} direction="row" justify="center" className={classes.videoChatSection}>
        <Grid item xs={6} className={classes.videoChatContainer}>
          <WebRTCVideo videoName="Local" videoRef={this.setLocalVideoEl} muted={true}/>
        </Grid>
        <Grid item xs={6} className={classes.videoChatContainer}>
          <WebRTCVideo videoName="Remote" videoRef={this.setRemoteVideoEl}/>
        </Grid>
      </Grid>
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.root}>
        {this.renderVideoChatUI()}
        {this.renderSetupConnectionUI()}
        {this.renderTextCopiedSnackbar()}
      </div>
    );
  }
}

export default withStyles(styles)(WebRTCWithCarrierPigeonTab);