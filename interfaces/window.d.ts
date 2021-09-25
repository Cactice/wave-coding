interface Window {
  streamDestinations: MediaStreamAudioDestinationNode[];
  audioConstraints: boolean | MediaTrackConstraintSet;
  videoConstraints: boolean | MediaTrackConstraintSet;
}
