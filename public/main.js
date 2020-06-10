let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
const filter = document.querySelector('#filter')
const checkboxTheme = document.querySelector('#theme')
let client = {}
let currentFilter
//get stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        socket.emit('NewClient')
        video.srcObject = stream
        video.play()

        filter.addEventListener('change', (event) => {
            currentFilter = event.target.value
            video.style.filter = currentFilter
            SendFilter(currentFilter)
            event.preventDefault
        })

        document.getElementById('send').addEventListener('click', function () {
            var yourMessage = document.getElementById('yourMessage').value
            document.getElementById('yourMessage').value = ""
            document.getElementById('messages').textContent += yourMessage + '\n'
            SendMessage(yourMessage)
          })

        document.getElementById('clear all').addEventListener('click', function () {
            document.getElementById('messages').textContent = ""
          })

          document.getElementById('cardclose').addEventListener('click', function () {
            //document.getElementById('messages').textContent = ""
            document.getElementById("card").style.display = 'none';
          })
          
          document.getElementById('textcardclose').addEventListener('click', function () {
            //document.getElementById('messages').textContent = ""
            document.getElementById("textcard").style.display = 'none';
            document.getElementById("card").style.display = 'block';
            document.getElementById("text").style.display = 'none';

        })

          document.getElementById('streamandtext').addEventListener('click', function () {
            //document.getElementById('messages').textContent = "" textcard
            if ( document.getElementById("textcard").style.display == 'none' && document.getElementById("text").style.display === 'none' && document.getElementById("filtersandTheme").style.display == 'block' && document.getElementById("videoStream").style.display == 'block') {
                document.getElementById("text").style.display = 'block';
                document.getElementById("textcard").style.display = 'block';
                document.getElementById("card").style.display = 'none';
            }
            else {
                document.getElementById("text").style.display = 'block';
                document.getElementById("textcard").style.display = "block"
                document.getElementById("filtersandTheme").style.display = 'flex';
                document.getElementById("videoStream").style.display = 'flex';
                document.getElementById("card").style.display = 'none';
            }
          })

        //   document.getElementById('textOnly').addEventListener('click', function () {
        //     //document.getElementById('messages').textContent = "" videoStream filtersandTheme
        //     document.getElementById("text").style.display = 'block';
        //     document.getElementById("filtersandTheme").style.display = 'none';
        //     document.getElementById("videoStream").style.display = 'none';
        //   })
        

        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
            //This isn't working in chrome; works perfectly in firefox.
            // peer.on('close', function () {
            //     document.getElementById("peerVideo").remove();
            //     peer.destroy()
            // })
            // peer.on('data', function (data) {
            //     if (data && JSON.parse(data).type === "filter")
            //     let decodedData = new TextDecoder('utf-8').decode(data)
            //     let peervideo = document.querySelector('#peerVideo')
            //     peervideo.style.filter = decodedData
            // })
            peer.on('data', function (data) {
                //alert(data)
                //alert(JSON.stringify(data).type)
                //alert(JSON.parse(data).type)
                //alert(new TextDecoder('utf-8').decode(data).type)
                //alert(new TextDecoder('utf-8').decode(data))
                //alert(data[0].type)
                if (data) {
                    if ( JSON.parse(data).type === "text message") {
                        if (document.getElementById('text').style.display === 'none') {
                            alert('Other side is trying to reach you, please activate text')
                        }
                        document.getElementById('messages').textContent += JSON.parse(data).message + '\n'
                    } else if (JSON.parse(data).type === "filter") {
                    let decodedData = JSON.parse(data).filter
                    let peervideo = document.querySelector('#peerVideo')
                    peervideo.style.filter = decodedData
                    }
                }
              })
            return peer
        }

        //for peer of type init
        function MakePeer() {
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (data) {
                if (!client.gotAnswer) {
                    socket.emit('Offer', data)
                }
            })
            client.peer = peer
        }

        //for peer of type not init
        function FrontAnswer(offer) {
            let peer = InitPeer('notInit')
            peer.on('signal', (data) => {
                socket.emit('Answer', data)
            })
            peer.signal(offer)
            client.peer = peer
        }

        function SignalAnswer(answer) {
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        function CreateVideo(stream) {
            CreateDiv()

            let video = document.createElement('video')
            video.id = 'peerVideo'
            video.srcObject = stream
            video.setAttribute('class', 'embed-responsive-item')
            document.querySelector('#peerDiv').appendChild(video)
            video.play()
            //wait for 1 sec
            setTimeout(() => SendFilter(currentFilter), 1000)

            video.addEventListener('click', () => {
                if (video.volume != 0)
                    video.volume = 0
                else
                    video.volume = 1
            })

        }

        function SessionActive() {
            document.write('Session Active. Please come back later')
        }

        function SendFilter(filter) {
            if (client.peer) {
                data = {filter: filter, type: "filter"}
                client.peer.send(JSON.stringify(data))
            }
        }

          function SendMessage(message) {
              if (client.peer) {
                  data = {message: message, type:'text message'}
                  client.peer.send(JSON.stringify(data))
              }
          }

        function RemovePeer() {
            document.getElementById("peerVideo").remove();
            document.getElementById("muteText").remove();
            if (client.peer) {
                client.peer.destroy()
            }
        }

        socket.on('BackOffer', FrontAnswer)
        socket.on('BackAnswer', SignalAnswer)
        socket.on('SessionActive', SessionActive)
        socket.on('CreatePeer', MakePeer)
        socket.on('Disconnect', RemovePeer)
        //socket.on('RecieveMessage', SetMessage)

    })
    .catch(err => document.write(err))

checkboxTheme.addEventListener('click', () => {
    if (checkboxTheme.checked == true) {
        document.body.style.backgroundColor = '#212529'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#fff"
            document.querySelector('#messages').style.color ="white"
        }

    }
    else {
        document.body.style.backgroundColor = '#fff'
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#212529"
            document.querySelector('#messages').style.color ="black"
        }
    }
}
)

function CreateDiv() {
    let div = document.createElement('div')
    div.setAttribute('class', "centered")
    div.id = "muteText"
    div.innerHTML = "Click to Mute/Unmute"
    document.querySelector('#peerDiv').appendChild(div)
    if (checkboxTheme.checked == true)
        document.querySelector('#muteText').style.color = "#fff"
}
