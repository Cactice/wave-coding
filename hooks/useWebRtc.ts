import { useState } from "react";

const useWebRtc = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [localConnection, setLocalConnection] = useState<RTCPeerConnection | null>(null);
  const [localChannel, setLocalChannel] = useState<RTCDataChannel | null>(null);
  const [remoteConnection, setRemoteConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteChannel, setRemoteChannel] = useState<RTCDataChannel | null>(null);
  const [localMessages, setLocalMessages] = useState<string>('');
  const [remoteMessages, setRemoteMessages] = useState<string>('');


  const disconnect = () => {
    if (!localConnection || !remoteConnection) { return }
    localConnection.close();
    remoteConnection.close();
  }

  const connect = async () => {
    console.log('connect!');
    try {
      const dataChannelParams = { ordered: true };
      setLocalConnection(new RTCPeerConnection())
      if (!localConnection) { return }
      localConnection.addEventListener('icecandidate', async e => {
        console.log('local connection ICE candidate: ', e.candidate);
        if (!e.candidate || !remoteConnection) { return }
        await remoteConnection.addIceCandidate(e.candidate);
      });

      setRemoteConnection(new RTCPeerConnection())
      if (!remoteConnection) { return }
      remoteConnection.addEventListener('icecandidate', async e => {
        console.log('remote connection ICE candidate: ', e.candidate);
        if (!e.candidate) { return }
        await localConnection.addIceCandidate(e.candidate);
      });

      setLocalChannel(localConnection
        .createDataChannel('messaging-channel', dataChannelParams)
      )
      if (!localChannel) { return }
      localChannel.binaryType = 'arraybuffer';
      localChannel.addEventListener('open', () => {
        console.log('Local channel open!');
        setConnected(true)
      });
      localChannel.addEventListener('close', () => {
        console.log('Local channel closed!');
        setConnected(false)
      });
      localChannel.addEventListener('message', _onLocalMessageReceived);

      remoteConnection.addEventListener('datachannel', _onRemoteDataChannel);

      const initLocalOffer = async () => {
        const localOffer = await localConnection.createOffer();
        console.log(`Got local offer ${JSON.stringify(localOffer)}`);
        const localDesc = localConnection.setLocalDescription(localOffer);
        const remoteDesc = remoteConnection.setRemoteDescription(localOffer);
        return Promise.all([localDesc, remoteDesc]);
      };

      const initRemoteAnswer = async () => {
        const remoteAnswer = await remoteConnection.createAnswer();
        console.log(`Got remote answer ${JSON.stringify(remoteAnswer)}`);
        const localDesc = remoteConnection.setLocalDescription(remoteAnswer);
        const remoteDesc = localConnection.setRemoteDescription(remoteAnswer);
        return Promise.all([localDesc, remoteDesc]);
      };

      await initLocalOffer();
      await initRemoteAnswer();
    } catch (e) {
      console.log(e);
    }
  }

  const _onLocalMessageReceived = (e: MessageEvent<string>) => {
    console.log(`Remote message received by local: ${e.data}`);
    setLocalMessages(localMessages + e.data + '\n');
  }

  const _onRemoteDataChannel = (e: RTCDataChannelEvent) => {
    console.log(`onRemoteDataChannel: ${JSON.stringify(e)}`);
    setRemoteChannel(e.channel)
    if (!remoteChannel) { return }
    remoteChannel.binaryType = 'arraybuffer';
    remoteChannel.addEventListener('message', _onRemoteMessageReceived.bind(this));
    remoteChannel.addEventListener('close', () => {
      console.log('Remote channel closed!');
      setConnected(false);
    });
  }

  const _onRemoteMessageReceived = (e: MessageEvent<string>) => {
    console.log(`Local message received by remote: ${e.data}`);
    setRemoteMessages(remoteMessages + e.data + '\n');
  }

  const _sendMessage = (value: string, channel: RTCDataChannel) => {
    if (value === '') {
      console.log('Not sending empty message!');
      return;
    }
    console.log('Sending remote message: ', value);
    channel.send(value);
  }
}
