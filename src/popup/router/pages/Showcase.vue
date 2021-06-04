<template>
  <div
    class="showcase"
    :class="{ left: step > 1 }"
  >
    <Logo class="logo" />

    <div class="header">
      <template v-if="step <= 1">
        <transition name="fade">
          <div>
            <span class="heading">
              {{ $t('pages.index.heading') }}
            </span>
            <AnimatedSpinner class="spinner" />
          </div>
        </transition>
      </template>

      <transition name="slide">
        <div
          v-if="step >= introSteps"
          class="note"
        >
          Release {{ currentNote.version }}
          <div :class="['note', currentNote.noteClass ]">
            {{ currentNote.type }}
          </div>
        </div>
      </transition>
    </div>
    <div
      v-if="step >= introSteps"
      class="content-header note"
    >
      {{ currentNote.title }}
    </div>

    <transition name="slide">
      <div
        v-if="step >= introSteps"
        class="content"
      >
        <div
          v-for="src in currentNote.imgs"
          :key="src + Math.random()"
          class="item"
        >
          <img :src="src">
        </div>
      </div>
    </transition>

    <div class="footer">
      <template v-if="step === 1">
        <transition name="fade">
          <div class="note">
            <div>
              Dev Update
            </div>
            <div>
              May 2021
            </div>
          </div>
        </transition>
      </template>
    </div>
  </div>
</template>

<script>
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';
import Logo from '../../../icons/logo.svg?vue-component';

export default {
  components: {
    Logo, AnimatedSpinner,
  },
  data: () => ({
    step: 0,
    introSteps: 3,
    changelogImages: [],
    versions: ['0.7.0', '0.7.1'],
    parsedImagesHash: 'eyIwLjcuMSI6eyJGZWF0dXJlcyI6W3siUmVicmFuZCBBRVggcG9wdXBzIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTgxMTQwODMtY2E3MmFhMDAtYjNlZi0xMWViLTlhZDUtNjljMDIyNzllMmYyLnBuZyIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTgxMTQwODEtYzk0MTdkMDAtYjNlZi0xMWViLTg5OTgtMDI5NzQxOWVmZmIxLnBuZyJdfV0sIkJ1ZyBGaXhlcyI6W3siZml4KGhlYWRlcik6IGRpc2FsbG93IHRpdGxlIHRleHQgd3JhcHBpbmciOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vOTAwODA3NC8xMTg4MDE5OTItZjk1M2I5MDAtYjhlNC0xMWViLTkzY2MtZDM5MWU1MzQzOGQ2LnBuZyJdfSx7ImZpeChpbnZpdGUpOiBmaXggaGFuZGxlTm90RW5vdWdoRm91bmRzRXJyb3IgcGFyYW1ldGVycyI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS82OTg5NjIwNC8xMTkxNjc2NTMtYjdlYzE2ODAtYmE2OC0xMWViLTkyNTMtZWQzNzg1YzU4MDQzLnBuZyJdfSx7ImZpeChyZWNlbnQtdHhzKTogYWxpZ24gZW1wdHkgYW5kIGxvYWRpbmcgc3RhdGVzIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTg2MTI4NTItZGI5MDMyMDAtYjdjNi0xMWViLThlZjktMDQ4NWYxNzRkYzU2LmdpZiIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTg2MTI4NjAtZGQ1OWY1ODAtYjdjNi0xMWViLTk0NjYtZGU2YzVlNWEyM2Q4LmdpZiJdfV0sIk1haW50ZW5hbmNlIjpbeyJjaG9yZTogZmxpY2tpdHkgYnV0dG9ucyBob3ZlciBhbmQgcHJlc3NlZCBzdHlsZSI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80Nzg1OTEyNC8xMTg5NDE4NzctZGJjMTM2ODAtYjk1YS0xMWViLTljYjAtNzFiMDQ1NTBiZTdiLnBuZyIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ3ODU5MTI0LzExODk0MTk0NS1mMDlkY2EwMC1iOTVhLTExZWItOTQxZS0wOGQ1ZjExN2JiYWMucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExMzYwNjUzMC1kMDNhZGEwMC05NjUwLTExZWItOTJlYi0xNWM2OTRhOGZmZmEucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExMzYwNjUzNy1kMjA0OWQ4MC05NjUwLTExZWItOGY1Ny1kYjBhMWE4YWNhN2UucG5nIl19XX0sIjAuNy4wIjp7IkZlYXR1cmVzIjpbeyJSZWJyYW5kIENvbmZpcm1UcmFuc2FjdGlvblNpZ24gbW9kYWwiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNTc1ODcwMy0xOGJmZmE4MC1hM2E4LTExZWItOWY5My05ODBlMjFmOTkwNDkucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNTc1ODcxNC0xYTg5YmUwMC1hM2E4LTExZWItOWRlNS01NGZiZGQ2ZjJiYWIucG5nIl19LHsiZmVhdChpY29ucyk6IHVwZGF0ZSByZWJyYW5kZWQgaWNvbnMiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMTQ4MTk1NDEtZmI2N2JiMDAtOWUwMC0xMWViLThlZjctMjk1YzdiNWFjYjczLnBuZyJdfSx7ImZlYXQ6IGFjY291bnQgbGlzdCI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS85MDA3ODUxLzExMTI2NDU0My1jNDA2YzI4MC04NjM4LTExZWItODBhMi01MzI1YWYzZDc5NGUucG5nIl19LHsiVHJhbnNhY3Rpb25PdmVydmlldyBjb21wb25lbnQiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExMzMzMzMzMy1mNWZmNzA4MC05MzJhLTExZWItODcwMS01YzAxM2I2NzQzODMucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExMzMzNDQ2OC02MmM3M2E4MC05MzJjLTExZWItOGVmNy0zNGI2MTRmNmVkMjMucG5nIl19XSwiQnVnIEZpeGVzIjpbeyJmaXgoYWNjb3VudC1pbmZvKTogZml4IGFsaWdubWVudCBvbiBjb3B5IGFuZCBuYW1lIGNsYWltIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzcwOTg0NDkvMTE2MjE4NTIyLWYzZjNjYTgwLWE3OGQtMTFlYi05MjIwLTlmZjVjM2I5NzdkMi5wbmciXX0seyJGaXggYXBwIGJhY2tncm91bmQgY29sb3IiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NjgwMi04ODY2NDA4MC05ZTEwLTExZWItOTA1MC0yMWU1ZmJmZjk4MzAucG5nXCI+fCA8aW1nIHdpZHRoPVwiMzk1XCIgYWx0PVwiU2NyZWVuc2hvdCAyMDIxLTA0LTE1IGF0IDEzIDE0IDIwXCIgc3JjPVwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NzAyMC1iYjEwMzkwMC05ZTEwLTExZWItODU4Ny1iZDI1MmFiNDEwNzcucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NjU5Ny01OGI3Mzg4MC05ZTEwLTExZWItOTQ0MS01Y2Y4ZmVmMmU1ODQucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NjY5Ni02ZDkzY2MwMC05ZTEwLTExZWItOGJkMC0zNmJlZjc5ZDcxZjcucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NjgwMi04ODY2NDA4MC05ZTEwLTExZWItOTA1MC0yMWU1ZmJmZjk4MzAucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDg4NzAyMC1iYjEwMzkwMC05ZTEwLTExZWItODU4Ny1iZDI1MmFiNDEwNzcucG5nIl19LHsiZml4KGljb25zKTogcmVwbGFjZSBpY29ucyB3aXRoIHRyYW5zcGFyZW5jeSB2ZXJzaW9ucyI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzExNTE4OTM4Ni1iOWVkNGQ4MC1hMTI5LTExZWItODZkNS01ODAxZWYwMzhjOGQucG5nIl19LHsiZml4KHFyLWNvZGUtcmVhZGVyKTogZG8gbm90IGludGVyYWN0IHdpdGggaGVhZGVyIHN0eWxlcyBleHBsaWNpdGx5IjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTUzNTQwMTQtZDkzN2I5ODAtYTFjMS0xMWViLTgwN2ItOGM2NjI4NGY3YWJlLnBuZ1wiIHdpZHRoPVwiMzQwIl19LHsiZml4KHdlYi1pZnJhbWUtcG9wdXBzKTogbWFrZSBpZnJhbWUgcG9wdXBzIG5vdFJlYnJhbmRlZCI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzExNDM2NjI0Mi05OTFmNzgwMC05YmJlLTExZWItOGYxMy03NDY2YWQ5NDBjMjIucG5nIl19LHsiZml4KHR4LWRldGFpbHMpOiBrZWVwIGhlYWRlciBvbiB0b3AiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNDgyMzUxLzExNDkxMjc5OS0xYzQ0MDY4MC05ZTI5LTExZWItOGE5OS00NjE5MDg0ZWI4ZGEuZ2lmIl19XSwiU3R5bGUiOltdLCJNYWludGVuYW5jZSI6W3sicmVmYWN0b3IoYWNjb3VudHMpOiB1c2UgUGxhdGUgY29tcG9uZW50IjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTQ5OTE2OTgtOGVhNGZkMDAtOWVhMi0xMWViLTk1MTAtMmE5MGUwNmIxNDZhLmdpZiIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTQ5OTIwNzktMDU0MWZhODAtOWVhMy0xMWViLTg3NmYtOWEyZTY3M2ZmN2I2LmdpZiJdfSx7ImNob3JlKHR4KTogcmV0dXJuIGVtcHR5IHR4IGxpc3QgaWYgZ2V0VHhCeUFjY291bnQgcmV0dXJucyBlcnJvciI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzExNDgxODM3OS0wYzE3MzE4MC05ZGZmLTExZWItODc5My0wMzM4MjNmMzU2NjgucG5nIl19XX19',
  }),
  computed: {
    currentNote() {
      const note = this.changelogImages[this.step - this.introSteps];
      let preparedNote = {
        version: '',
        type: '',
        noteClass: '',
        title: '',
        imgs: [],
      };
      if (note) {
        const [version, type, content] = note;
        const title = content[0].substr(content[0].indexOf(':') + 1).trim();
        preparedNote = {
          version,
          type,
          noteClass: {
            'Bug Fixes': 'bug',
            Features: 'feature',
            Maintenance: 'maintenance',
          }[type],
          title: title[0].toUpperCase() + title.slice(1),
          imgs: content[1].map((i) => i.match(/https.*?\.(png|jpg|gif)/)[0]),
        };
      }
      return preparedNote;
    },
  },
  watch: {
    step: {
      handler(val) {
        if (val > 1) document.getElementById('app').classList.add('showcase-big');
        else document.getElementById('app').classList.remove('showcase-big');
      },
      immediate: true,
    },
  },
  async mounted() {
    const images = JSON.parse(atob(this.parsedImagesHash));
    this.versions.forEach((version) => Object.entries(images[version]).forEach(([k, v]) => {
      v.forEach((i) => this.changelogImages.push([
        version,
        k,
        [Object.keys(i)[0], ...Object.values(i)],
      ]));
    }));
    document.body.onkeyup = (e) => {
      if (e.keyCode === 37) this.step -= this.step > 0 ? 1 : 0;
      if (e.keyCode === 39) {
        this.step += this.step < this.changelogImages.length + this.introSteps - 1 ? 1 : 0;
      }
    };
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.showcase {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 42px;
  text-align: center;
  overflow: hidden;

  &.left {
    .logo,
    .header {
      width: 360px;
      align-self: flex-start;
    }

    .header {
      text-align: left;
      margin-left: 96px;
    }
  }

  svg {
    height: 35px;
    margin-bottom: 8px;
  }

  .note {
    @extend %face-sans-20-medium;

    font-size: 25px;
    line-height: 32px;
    color: variables.$color-dark-grey;

    &.feature {
      color: variables.$color-blue;
    }

    &.bug {
      color: variables.$color-error;
    }

    &.maintenance {
      color: variables.$color-warning;
    }
  }

  .header {
    text-align: center;
    width: 360px;

    span {
      display: block;

      &.heading {
        @extend %face-sans-16-medium;

        color: variables.$color-blue;
        padding: 5.5px 0;
        margin: 0 auto;
      }
    }

    .spinner {
      width: 256px;
      height: 256px;
      color: variables.$color-blue;
    }
  }

  .content-header {
    margin-bottom: 15px;
    font-size: 20px;
    color: variables.$color-light-grey;
  }

  .content {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    width: 800px;
    height: 380px;
    overflow: scroll;

    div {
      margin: 10px;
      flex-basis: 240px;

      img {
        display: block;
        width: 100%;
        height: auto;
      }
    }
  }

  .footer {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    animation-duration: 3s;
    animation-name: slidein;

    span {
      margin-bottom: 16px;
    }

    @keyframes slidein {
      from {
        opacity: 0.1;
        margin-top: 50px;
      }

      to {
        opacity: 1;
        margin-top: 0;
      }
    }
  }

  .fade-enter {
    opacity: 0;
  }

  .fade-enter-to {
    transition: opacity 0.4s;
    opacity: 1;
  }

  .fade-leave {
    visibility: hidden;
  }

  .slide-enter {
    opacity: 0;
    margin-top: 30px;
  }

  .slide-enter-to {
    transition: opacity 0.4s;
    transition: margin-top 0.4s;
    opacity: 1;
    margin-top: 0;
  }
}
</style>
