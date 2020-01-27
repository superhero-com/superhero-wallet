<template>
    <div>
        <div>
            <label class="switch">
                <input type="checkbox" :checked="onoff" @change="onChange">
                <span class="slider round"></span>
            </label>
        </div>
    </div>  
</template>

<script>
export default {
    data() {
        return {
            
        };
    },
    props: ['onoff','onChange'],
    methods: {

    }
}

</script>

<style>
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  margin: 10px 0px 0px 0px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #ff0d6a;
}

input:focus + .slider {
  box-shadow: 0 0 1px #ff0d6a;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>