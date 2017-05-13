import React from 'react';
import {
	StyleSheet,
	Text,
	View,
	Navigator,
	StatusBar,
	TouchableOpacity
} from 'react-native';

import Main from './screens/Main';

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.initialRoute = {
			index: 0,
			display: true,
			component: Main,
			statusBarHidden: true
		}
	}
	componentDidMount() {
		StatusBar.setBarStyle(0);
	}

	configureScene(route, routeStack) {
		return Navigator.SceneConfigs.PushFromRight;
	}

	routeMapper = {
		LeftButton: (route, navigator, index, navState) => null,
		RightButton: (route, navigator, index, navState) => null,
		Title: (route, navigator, index, navState) => null
	};

	render(){
		return (
			<Navigator
				initialRoute={this.initialRoute}
				configureScene={this.configureScene}
				renderScene={(route, navigator) => {
					return <route.component navigator={navigator} title={route.title} index={route.index} />
				}}
			/>
		);
	}
}




const styles = StyleSheet.create({
	container: {
		flexGrow:1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	navBar: {
		borderBottomWidth: 1,
		borderBottomColor: "#ddd",
	},
	navTitle: {
		paddingTop: 10,
		fontSize: 18,
		fontWeight: "500",
	},
	navBackBtn: {
		paddingTop: 10,
		paddingLeft: 10,
		fontSize: 18,
		color: "#555",
	}
});
