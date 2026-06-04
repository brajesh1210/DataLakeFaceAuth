import React, {Component, ErrorInfo, ReactNode} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, SafeAreaView} from 'react-native';
import {TYPOGRAPHY as typography} from '@theme/typography';
import {COLORS as colors} from '@theme/colors';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({hasError: false, error: null});
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={[typography.h1, styles.title, {color: colors.primary.navy}]}>
              Oops! Something went wrong.
            </Text>
            <Text style={[typography.body, styles.message, {color: colors.text.secondary}]}>
              An unexpected error occurred. Please restart the app.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorContainer}>
                <Text style={[typography.caption, {color: colors.accent.red}]}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, {backgroundColor: colors.primary.navy}]} 
              onPress={this.handleReset}>
              <Text style={[typography.label, {color: '#fff'}]}>Restart App</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
});
