import React, { useEffect, useState } from "react";
import axios from 'axios'
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import PlayerModal from "./PlayerModal";
import { displayTime } from "./util";
import { styles } from "./MusicPlayer.style";
// import { PLAY_LIST } from "./listSong";

export default function MusicPlayer() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [playingSong, setPlayingSong] = useState({});
  const [isBuffering, setBuffering] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [isRewinding, setRewinding] = useState(false);
  const [currentPosition, setcurrentPosition] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [playbackObject, setPlaybackObject] = useState(null);
  const [data, setdata]=useState([]);
  const [isLoading, setisLoading]=useState(true);
  useEffect(() => {
    getListPhotos();
    return ()=>{

    }
  },[])
  getListPhotos = () => {
    const apiURL='https://5ed4-168-63-201-182.ngrok.io/api/product/list';
    fetch(apiURL)
    .then((res) => res.json())
    .then((resJson)=>{
      setdata(resJson)
      
    }).catch((error) => {
      console.log('Error',error)
    }).finally(()=>setisLoading(false))
  }
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>DEMO MUSIC.</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    // <Text style={styles.songName}>{item.name}</Text>
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => playSong(item, index)}
    >
      <Image source={{ uri: 'https://5ed4-168-63-201-182.ngrok.io/getimages/'+item.imageName }} style={styles.coverImage} />

      <View style={{ flex: 1 }}>
        <Text style={styles.songName}>{item.name}</Text>

        <View style={styles.songInfo}>
          <Text style={styles.singerName}>{item.description}</Text>
          <Text style={styles.songDuration}>{displayTime(item.duration)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // const keyExtractor = (item) => item.id;

  const playSong = async (song, index) => {
    setModalVisible(true);
    setBuffering(true);
    setPlaying(false);
    setcurrentPosition(0);
    setCurrentSongIndex(index);
    setPlayingSong(song);

    try {
      // Unload playback when change sound
      if (playbackObject !== null) {
        await playbackObject.unloadAsync();
      }

      // Play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri:'https://5ed4-168-63-201-182.ngrok.io/getmedia/'+ song.filemusic},
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setPlaybackObject(sound);
    } catch (error) {
      alert("Can't play this song!");
    }
  };

  const onPlaybackStatusUpdate = ({
    isLoaded,
    isBuffering,
    isPlaying,
    error,
  }) => {
    if (!isLoaded) {
      if (error) {
        alert(`Encountered a fatal error during playback: ${error}`);
      }
    } else {
      setBuffering(isBuffering);
      setPlaying(isPlaying);
    }
  };

  const updatePosition = async (position) => {
    await playbackObject.setPositionAsync(position);
    setcurrentPosition(position);
    setRewinding(false);
  };

  const pauseOrResumeSong = async () => {
    if (isPlaying) {
      setPlaying(false);
      playbackObject.pauseAsync();
    } else {
      if (currentPosition === playingSong.duration) {
        setcurrentPosition(0);
        await playbackObject.replayAsync();
      } else {
        await playbackObject.playAsync();
      }
    }
  };

  const changeSong = (index) => {
    if (index < 0) index = data.length - 1;
    else if (index == data.length) index = 0;

    playSong(data[index], index);
  };

  const stopPlaySong = () => {
    setModalVisible(false);
    setPlaying(false);
    playbackObject.unloadAsync();
  };

  // https://reactjs.org/docs/hooks-effect.html
  useEffect(() => {
    // Run time slider
    if (isPlaying && !isBuffering) {
      const interval = setInterval(async () => {
        const {
          positionMillis,
          durationMillis,
        } = await playbackObject.getStatusAsync();

        // Don't update position when user rewinding
        if (!isRewinding) setcurrentPosition(positionMillis || 0);

        // Stop sound if positionMillis equals durationMillis or less than 1 second
        if (positionMillis >= durationMillis - 900) {
          await playbackObject.setPositionAsync(durationMillis);
          setcurrentPosition(durationMillis);
          setPlaying(false);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, isBuffering, isRewinding]);

  return (
    <SafeAreaView style={styles.container}>
       {isLoading ? <ActivityIndicator/>
          // <View style={styles.center}>
          //   {/* https://reactnative.dev/docs/activityindicator */}
          //   <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          // </View>)
            : (
      <FlatList
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        // keyExtractor={keyExtractor}
        keyExtractor={item=>`key-${item.id}`}
        showsVerticalScrollIndicator={false}
      />
      )}

      <PlayerModal
        isModalVisible={isModalVisible}
        closeModal={stopPlaySong}
        playingSong={playingSong}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        currentSongIndex={currentSongIndex}
        currentPosition={currentPosition}
        setcurrentPosition={setcurrentPosition}
        setRewinding={setRewinding}
        updatePosition={updatePosition}
        pauseOrResumeSong={pauseOrResumeSong}
        changeSong={changeSong}
      />
    </SafeAreaView>
  );
}