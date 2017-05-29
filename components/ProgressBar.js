import React from 'react';
import {
	View,
	Easing,
	Animated,
	StyleSheet,
	Dimensions,
	Platform
} from 'react-native';

export default class extends React.Component {
	static defaultProps() {
		return {
			style: styles,
			easing: Easing.inOut(Easing.ease),
			easingDuration: 10
		};
	}

	constructor(props) {
		super(props);
		this.state = {
			width: 100,
			progress: new Animated.Value(1)
		};
	}

	componentWillReceiveProps(next) {
		if (next.progress >= 0 && next.progress != this.state.progress) {
			this.update();
		}
	}

	onLayout(layout) {
		const {width} = Dimensions.get('window');
		const correct = width === 320 ? 20 : 40;
		this.setState({width: width - correct});
	}

	render() {
		const width = this.state.progress.interpolate({
			inputRange: [0, 1],
			outputRange: [0 * this.state.width, 1 * this.state.width],
		});

		const progress = parseFloat(this.props.progress);
		const backgroundColor = progress > 0.3
			? '#fff'
			: `rgba(255, 0, 0, ${Math.round(progress * 100) % 2 == 0 ? 1 : 0.5})`;

		return (
			<View style={styles.wrapper}
				onLayout={(e) => this.onLayout(e.nativeEvent.layout)}>
				<View 
					style={[
						styles.background, 
						this.props.style,
						{width: this.state.width}
					]}>
					<Animated.View 
						style={[
							styles.fill,
							{backgroundColor},
							{width}
						]}/>
				</View>
			</View>
		);
	}

	update() {
		Animated.timing(this.state.progress, {
			easing: this.props.easing,
			duration: 200,
			toValue: this.props.progress
		}).start();
	}
}


const styles = StyleSheet.create({
	wrapper: {
		marginBottom: 23
	},
	background: {
		backgroundColor: 'transparent',
		borderStyle: 'solid',
		borderColor: '#fff',
		borderRadius: 3,
		borderWidth: 1,
		height: 13,
		overflow: 'hidden'
	},
	fill: {
		height: 13
	}
});
