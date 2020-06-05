<template>
  <div id="app">
    <div id="map"></div>
    <div class="slide-nav">
      <span class="toggle" @click="toggleNav">
        <ion-icon name="arrow-forward-circle-outline"></ion-icon>
      </span>
      <div class="title">
        <h1 >口罩地圖</h1>
        <ion-icon name="map-outline"></ion-icon>
      </div>
      <div class="area">
        <div>
          <label for="cityName">縣市</label>
          <ion-icon name="globe"></ion-icon>
          <select id="cityName" v-model="select.city" 
          @change="clearArea(),updateMap()">
            
            <option 
            v-for="(city,cindex) in cityName"
            :value="city.CityName"
            :key="cindex"
            >
              {{city.CityName}}
            </option>
          </select>
        </div>
        <div>
          <label for="cityName">地區</label>
          <ion-icon name="golf"></ion-icon>
          <select  id="cityName" v-model="select.area"  @change="updateMap">
            <template v-if="select.city">
              <option 
              v-for="(area,aindex) in areaName.AreaList"
              :key="aindex"
              :value="area.AreaName"
              >
              {{area.AreaName}}
              </option>
            </template>
          </select>
        <h2 class="p-number">{{select.city}}{{select.area}}有{{pharmacyNumber}}家藥局</h2>
        </div>
      </div>
        <ul class="mask-list">
          <li class="mask-shop"
          v-for="data in pharmacyData"
          :key="data.properties.id"
          @click="panTo(data)"
          >
            <h2 class="name">{{data.properties.name}}</h2>
            <p class="phone">{{data.properties.phone}}</p>
            <div class="all-mask">
              <p class="p-mask" :class="{outStock:!data.properties.mask_adult}">
                成人口罩:
                {{data.properties.mask_adult ? data.properties.mask_adult:'無庫存'}}
              </p>
              <p class="p-mask child" :class="{outStock:!data.properties.mask_child}">
                小孩口罩:
                {{data.properties.mask_child ? data.properties.mask_child:'無庫存'}}
              </p>
            </div>
            <a :href="`https://www.google.com.tw/maps/place/'${data.properties.address}`" 
            target="_blank" title="Google Map"
            ><ion-icon name="arrow-redo-circle-outline"></ion-icon></a>
            <p class="address">{{data.properties.address}} </p>
          </li>
        </ul>
    </div>
    <loading :active.sync="isLoading"></loading>
  </div>
</template>

<script>
import axios from 'axios'
import "leaflet/dist/leaflet.css";
import $L from "leaflet";

import cityName from '@/assets/cityName.json'
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster";


let osmMap ={}

let osm = {
  addMarker( coordinates, properties){
    const icon = properties.mask_adult || properties.mask_child ? icons.green : icons.black;
  L.marker([
    coordinates[1],
    coordinates[0]
  ],{icon:icon}).addTo(osmMap).bindPopup(
  `<div class="p-info">
    <h2>藥局名稱 : ${properties.name}</h2>
    <p>電話 : ${properties.phone}</p>
    <p>${properties.updated}</p>
    <span class="p-mask" :class="{outStock:!properties.mask_adult}">
    成人口罩:${properties.mask_adult}</span>
    <span class="p-mask child" :class="{outStock:!properties.mask_adult}">
    小孩口罩:${properties.mask_child}</span>
    <a href="https://www.google.com.tw/maps/place/${properties.address}">地址:${properties.address}</a>
  </div>
  `);
  }
}

let iconSetting ={
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}

let icons = {
  green:new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  ...iconSetting
  }),
  black:new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  ...iconSetting
  }),
}

export default {
  name:'app',
  data(){
    return{
      isLoading:true,
      data:[],
      pharmacyData:{},
      cityName,
      areaName:'',
      select:{
        city:'宜蘭縣',
        area:'',
      }
    }
  },
  computed:{
    pharmacyNumber(){
      return this.pharmacyData.length
    }
  },
  methods:{
    updateMap(){
      this.isLoading = true
      this.removeMarker()
      const pharmacies = this.data.filter((pharmacy)=>{
        return pharmacy.properties.county === this.select.city
      })
      this.areaName = this.AreaList(this.select.city)[0]//給區域Option資料
      if(this.select.area){
        //用縣市及鄉鎮市區所跑的資料
        let Area = this.select.area
        let AreaData = pharmacies.filter(item =>{
          return item.properties.town === Area
        })
        AreaData.forEach((p)=>{
          let coordinates = p.geometry.coordinates
          let properties = p.properties
          osm.addMarker(coordinates,properties,p)
        })
        this.pharmacyData = AreaData
        this.panTo(AreaData[0])
        this.isLoading = false
      }else{
        //只用縣市所跑的資料
        pharmacies.forEach((p)=>{
          let coordinates = p.geometry.coordinates
          let properties = p.properties
          osm.addMarker(coordinates,properties,p)
        })
        this.pharmacyData = pharmacies
        this.panTo(pharmacies[0])
        this.isLoading = false
      }
    },
    removeMarker() {
      osmMap.eachLayer((layer)=>{
        if(layer instanceof L.Marker){
          osmMap.removeLayer(layer)
        }
      })
    },
    panTo(item){
      const icon = item.properties.mask_adult || item.properties.mask_child ? icons.green : icons.grey;
      let {properties,geometry} = item
      osmMap.panTo([geometry.coordinates[1],geometry.coordinates[0]])
      L.marker([
        geometry.coordinates[1],
        geometry.coordinates[0]
      ],{icon:icon}).addTo(osmMap).bindPopup(
      `<div class="p-info">
        <h2>藥局名稱 : ${properties.name}</h2>
        <p>電話 : ${properties.phone}</p>
        <p>最後更新時間 : ${properties.updated}</p>
        <span class="p-mask" :class="{outStock:!properties.mask_adult}">
        成人口罩:${properties.mask_adult?properties.mask_adult:'無庫存'}</span>
        <span class="p-mask child" :class="{outStock:true}">
        小孩口罩:${properties.mask_child?properties.mask_child:'無庫存'}</span>
        <a href=https://www.google.com.tw/maps/place/${properties.address}">地址:${properties.address}</a>
      </div>
      `).openPopup()

    },
    AreaList(city){
      return cityName.filter(c=> c.CityName === city)
    },
    clearArea(){
      this.select.area = ''
    },
    toggleNav(){
      let slideNav = document.querySelector('.slide-nav')
      let icon = document.querySelector('.toggle ion-icon')
      slideNav.classList.toggle('toggleNav')
      icon.classList.toggle('iconRotate')
    }
  },
  mounted(){
    const url = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json'
    this.isLoading = true
    axios.get(url)
    .then((res)=>{
      this.data = res.data.features
      this.updateMap()
      this.isLoading = false
    })
    .catch((error)=>{
      console.log(error)
      this.isLoading = false
    })

    osmMap = L.map('map', {
      center: [25.03, 121.55],
      zoom: 15,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a target="_blank" href="https://www.openstreetmap.org/">© OpenStreetMap 徐智宏</a>',
      maxZoom: 18,
    }).addTo(osmMap);
    

  }
}



</script>

<style src="@/assets/css/map.css">
</style>
