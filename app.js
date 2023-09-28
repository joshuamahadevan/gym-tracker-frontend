const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];

let visible = true
// pose identification - callback function
function onResults(results) {
  if (!results.poseLandmarks) return;

  landmarks = results.poseLandmarks

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Only overwrite missing pixels.
  canvasCtx.globalCompositeOperation = 'destination-atop';
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);

  canvasCtx.globalCompositeOperation = 'source-over';
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                 {color: '#00FF00', lineWidth: 4});
  drawLandmarks(canvasCtx, results.poseLandmarks,
                {color: '#FF0000', lineWidth: 2});

  // angle calculations
  const LEFT_SHOULDER = 11,
  LEFT_ELBOW = 13,
  LEFT_WRIST = 15,
  VISIBILITY_THRESHOLD = 0.5

  if( landmarks[LEFT_SHOULDER]['visibility'] < VISIBILITY_THRESHOLD || 
      landmarks[LEFT_ELBOW]['visibility'] < VISIBILITY_THRESHOLD || 
      landmarks[LEFT_WRIST]['visibility'] < VISIBILITY_THRESHOLD
   ){
      visible = false;
    }
  else 
  {
    visible = true;
    shoulder = [landmarks[LEFT_SHOULDER].x,landmarks[LEFT_SHOULDER].y]
    elbow = [landmarks[LEFT_ELBOW].x,landmarks[LEFT_ELBOW].y]
    wrist = [landmarks[LEFT_WRIST].x,landmarks[LEFT_WRIST].y]

    angle = calculateAngle( shoulder, elbow, wrist )

    console.log( angle )
  }

  canvasCtx.restore();
}

// calculate angle between 3 points
function calculateAngle(a, b, c) {
  // Convert input points to arrays
  a = Array.isArray(a) ? a : [a[0], a[1]];
  b = Array.isArray(b) ? b : [b[0], b[1]];
  c = Array.isArray(c) ? c : [c[0], c[1]];

  // Calculate the angle in radians
  const radians = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]);

  // Convert radians to degrees
  let angle = Math.abs((radians * 180.0) / Math.PI);

  // Ensure the angle is between 0 and 180 degrees
  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}


const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
camera.start();