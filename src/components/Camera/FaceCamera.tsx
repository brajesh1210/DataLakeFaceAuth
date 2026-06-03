import React, {useRef} from 'react';
import {StyleSheet, ViewProps} from 'react-native';
import {Camera, useCameraDevice, useFrameProcessor} from 'react-native-vision-camera';
import {useFaceDetector} from 'react-native-vision-camera-face-detector';
import {Worklets} from 'react-native-worklets-core';

export interface FaceCameraProps extends ViewProps {
  isActive: boolean;
  onFaceDetected: (face: any) => void;
  children?: React.ReactNode;
}

export const FaceCamera: React.FC<FaceCameraProps> = ({
  isActive,
  onFaceDetected,
  style,
  children,
}) => {
  const device = useCameraDevice('front');

  const {detectFaces} = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'all',
    classificationMode: 'all',
    contourMode: 'none',
    minFaceSize: 0.15,
  });

  const onFaceJS = Worklets.createRunOnJS((face: any) => {
    onFaceDetected(face);
  });

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const faces = detectFaces(frame);
      if (faces && faces.length > 0) {
        onFaceJS(faces[0]);
      } else {
        onFaceJS(null);
      }
    },
    [detectFaces],
  );

  if (!device) {
    return null;
  }

  return (
    <>
      <Camera
        style={[StyleSheet.absoluteFill, style]}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
      />
      {children}
    </>
  );
};
