<template>
  <div>
    <v-tour name="onboarding" :steps="steps" :options="{ highlight: true }">
      <template slot-scope="tour">
        <transition name="fade">
          <v-step
          v-if="tour.currentStep === index"
          v-for="(step, index) of tour.steps"
          :key="index"
          :step="step"
          :previous-step="tour.previousStep"
          :next-step="tour.nextStep"
          :stop="tour.stop"
          :is-first="tour.isFirst"
          :is-last="tour.isLast"
          :labels="tour.labels"
          :highlight="tour.highlight"
          :class="tour.currentStep === 2 ? 'tip-step' : ''">
            <template>
              <div slot="header" class="step-header">
                {{ $t(`onboarding.step_${tour.currentStep + 1}.title`) }} <span class="step-info"> ({{ tour.currentStep + 1 }}/10) </span>
              </div>
              <div slot="content" class="step-content" v-html="$t(`onboarding.step_${tour.currentStep + 1}.content`)"></div>
              <div slot="actions" ></div>
            </template>
          </v-step>
        </transition>
      </template>
    </v-tour>
    <div class="tour-actions" v-if="tourRunning" :class="!started ? 'not-started' : ''">
      <div class="container">
        <div class="tour-welcome-message">
          <Hero />
          <div>
            <h3>Hey superhero! Welcome onboard.</h3>
            <p>This short guide will walk you through the Superhero Wallet DApp and its features.</p>
          </div>
        </div>
        <div class="tour-control-buttons">
          <Button onboarding class="skip" @click="stop">Skip</Button>
          <Button v-if="started" onboarding @click="back" >Back</Button>
          <Button v-if="started" onboarding class="next" @click="next">Next</Button>
          <Button v-if="!started" onboarding class="start" @click="start">Start</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Hero from '../../../icons/hero.svg?vue-component';

export default {
  components: {
    Hero,
  },
  data: () => ({
    started: false,
    steps: [
      {
        target: '.tour__step1',
        params: {
          enableScrolling: false,
          placement: 'bottom',
        }
      },
      {
        route: '/account',
        target: '.tour__step2 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
      {
        target: '.tour__step3',
        params: {
          enableScrolling: false,
          placement: 'bottom',
        },
        route: '/tip',
      },
      {
        route: '/account',
        target: '.tour__step4 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
      {
        target: '.tour__step5 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
      {
        target: '.tour__step6 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
      {
        target: '.tour__step7 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
      {
        target: '.tour__step8 .button-content',
        params: {
          enableScrolling: false,
          placement: 'top',
        }
      },
    ]
  }),
  computed: {
    ...mapGetters(['tourRunning']),
    tour() {
      return this.$tours.onboarding;
    }
  },
  watch: {
    tourRunning(val) {
      if (val) this.showActions();
    }
  },
  methods: {
    showActions() {
      this.disableScroll();
    },
    start() {
      this.$tours.onboarding.start();
      this.started = true;
    },
    stop() {
      this.$tours.onboarding.skip();
      this.$store.commit('SET_TOUR_RUNNING', false);
      this.enableScroll();
    },
    disableScroll() {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    },
    enableScroll() {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    },
    back() {
      if (this.$tours.onboarding.steps[this.$tours.onboarding.currentStep - 1].route) {
        this.$router.push(this.$tours.onboarding.steps[this.$tours.onboarding.currentStep - 1].route)
        this.$nextTick(() => {
          this.$tours.onboarding.previousStep()
        })
      } else {
        this.$tours.onboarding.previousStep()
      }
    },
    next() {
      const nextStep = this.$tours.onboarding.steps[this.$tours.onboarding.currentStep + 1];
      if (nextStep && nextStep.route) {
        this.$router.push(nextStep.route);
        this.$nextTick(() => {
          this.$tours.onboarding.nextStep()
        });
      } else if (nextStep) {
        this.$tours.onboarding.nextStep();
      } else {
        this.$tours.onboarding.finish();
        this.$store.commit('SET_TOUR_RUNNING', false);
        this.enableScroll();
        this.started = false;
      }
    },
  },
}
</script>

<style lang="scss">
@import '../../../common/variables';
.v-step {
  background-color: #12121b !important;
  border-radius: 5px !important;
  border: 1px solid $secondary-color;
  padding: 14px !important;
  min-width: 345px;

  .step-header {
    background-color: #12121b !important;
    margin-bottom: 18px;

    .step-info {
      color: $text-color;
    }
  }

  .step-content {
    text-align: left;
    font-size: 14px;
    color: $text-color;
  }

  .v-step__arrow {
    border-color: #12121b !important;
    border: none !important;
    width: 35px !important;
    height: 12px !important;
    z-index: -3;
    background-repeat: no-repeat;
  }

  &[x-placement^='top'] {
    margin-bottom: 0.8rem !important;

    .v-step__arrow {
      background-image: url('../../../icons/arrow-up.png');
      transform: rotate(180deg);
      bottom: -0.75rem !important;
    }
  } 
  
  &[x-placement^='bottom'] {
    margin-top: 0.8rem !important;

    .v-step__arrow {
      background-image: url('../../../icons/arrow-up.png');
      top: -0.75rem !important;
    }
  }
  &.tip-step[x-placement^='bottom'] {
    margin-top: 1.8rem !important;
  }
}

.v-tour__target--highlighted {
  box-shadow: 0 0 0 99999px rgba(67, 67, 67, 0.6) !important;

  &:after {
    content: "";
    border: 1.5px dashed #fff !important;
    border-radius: 5px;
    background: rgba(42, 156, 255, 0.25) !important;
    pointer-events: none !important;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
}

.tour-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  background: #12121b;
  padding: 19px;
  padding-top: 0;
  padding-bottom: 25px;
  pointer-events: all;

  &.not-started {
    box-shadow: 0 0 0 99999px rgba(67, 67, 67, 0.6) !important;
  }

  &:after {
    content: "";
    background-image: url('../../../icons/onboarding-bg.png');
    position: absolute;
    top: -40px;
    bottom: 0;
    height: 100%;
    left: 0;
    right: 0;
    z-index: -1;
    background-repeat: no-repeat;
    background-position: top center;
  }
  .container {
    max-width: 357px;
    margin: 0 auto;
  }

  .tour-welcome-message {
    display: flex;
    align-items: flex-end;

    svg {
      width: 165px;
      margin-left: -51px;
      margin-right: 10px;
    }
    h3 {
      font-size: 16px;
      margin: 0;
      margin-bottom: 10px;
      line-height: 21px;
    }

    p {
      font-size: 14px;
      font-weight: normal;
      margin: 0;
      color: $text-color;
      line-height: 20px;
    }
  }

  .tour-control-buttons {
    margin-top: 25px;
    display: flex;
  }

}
</style>