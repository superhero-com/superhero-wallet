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
          {{ currentNote.version === '0.7.3'
            ? 'Ready for the future releases'
            : `Release ${currentNote.version}`
          }}
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
              Weeks 24-28
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
    versions: ['0.8.2'],
    parsedImagesHash: 'eyIwLjguMiI6eyJGZWF0dXJlcyI6W3siUmVicmFuZCBiYWxhbmNlcyI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzEyNTc4MTE1MC0wMWNkODNjMC0xMmNkLTQ4ZDEtYWM1My1iOTljMzdjMjAyMTAucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMjU3ODEyMTUtYTAwMDRjNzMtOTBmYS00ODE3LWJkNzEtN2QzZWYxNjM0MjM4LnBuZyIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzcwOTg0NDkvMTI1NzgxNDE2LWRjY2M4ZTkxLTI4ZDgtNDExMS04MTc2LWQ5Y2U2OTRiNTYwNi5wbmciXX0seyJSZWJyYW5kIG1vZGFscyI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5NDU5LTM0YzFjNTAwLWJhNTYtMTFlYi04ZGI0LTVhM2E0NDBjMzE4MC5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5NTEyLTQzYTg3NzgwLWJhNTYtMTFlYi05NDQyLWI2NWY1OGIxNzBkMC5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5NTI4LTQ3ZDQ5NTAwLWJhNTYtMTFlYi05NzAyLTg5ZDQ4NTc4ZmI2Zi5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5NDg3LTNhMWYwZjgwLWJhNTYtMTFlYi04NzgwLTgxYmEyMzY5YmJhMy5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5NDk2LTNlNGIyZDAwLWJhNTYtMTFlYi04OTYzLTg4YmQ0MzAzOGE2Mi5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTQ5OTYwLWFjOGZlZjgwLWJhNTYtMTFlYi05N2JjLWFiZDYyNGY3OThiZS5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTUwNjIwLTQ5ZWIyMzgwLWJhNTctMTFlYi04ZDg5LTUwYTdhYWZhYTJiNi5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTIwNjU0MTU1LTEzYjM5ODAwLWM0OGEtMTFlYi05MjY2LTRjZTVhZDlkNDhlNC5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTU3MjIxLWExOGM4ZDgwLWJhNWQtMTFlYi05NjI2LWUwMTI2MDU4ZmI1My5wbmciLCJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS80ODIzNTEvMTE5MTU3MjI5LWEzNTY1MTAwLWJhNWQtMTFlYi04OWVjLTkwM2I3MjZhZGU0MS5wbmciXX0seyJBZGQgTW9yZSBwYWdlIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzcwOTg0NDkvMTI1NzgxNTQwLWVkYzUwNDgzLWE5OWItNGVmYi1hM2VjLTAyY2NiN2NkMDcwMi5wbmciXX0seyJSZWJyYW5kIENvbmZpcm1SYXdTaWduIG1vZGFsIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzQ4MjM1MS8xMTg0NTYzOTQtZjZlNTM5ODAtYjcwMS0xMWViLThhNzctNjA3NDBkNzQ2NzViLnBuZyJdfV0sIkJ1ZyBGaXhlcyI6W3siRml4IGJyb2tlbiBtb2RhbHMiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMjU3ODIyMzgtYzlhZmZiMTAtMzI2My00M2FlLTk1OTEtZjM2Yjg3MjZmOTViLnBuZyJdfSx7IkZpeCBhZGRyZXNzIHRleHQgb3ZlcmZsb3ciOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vOTAwODA3NC8xMjA1ODM2MzctZmEwNjU2ODAtYzQ3MS0xMWViLTk2MDMtOTRjMGYxNzM3MTNlLnBuZyIsImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzkwMDgwNzQvMTIwNTg5NDIzLTJjYjU0YzgwLWM0N2MtMTFlYi05NTlkLTcxNDAzNDA5YjJiMy5wbmciXX0seyJmaXgocXItY29kZSk6IGlubGluZSB0cmFuc3BhcmVudCBzdHlsZSB0byBzaG93IHByZXZpZXcgaW4gY29yZG92YSI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzEyMjUyOTU5NC1mZDRjMzU4MC1kMDYwLTExZWItODhlMy05MGM2MTFiNDA0MWUucG5nIl19XSwiU3R5bGUiOlt7InN0eWxlKGRyb3Bkb3duKTogbWFrZSBkcm9wZG93biB3aWRlciBhbmQgYWx3YXlzIG9uIHRvcCI6WyJodHRwczovL3VzZXItaW1hZ2VzLmdpdGh1YnVzZXJjb250ZW50LmNvbS83MDk4NDQ5LzEyNDgwMzY2Mi1iYWZkODA4MC1kZjljLTExZWItOWExOS1kMzBiYjQxMjA1NDcuZ2lmIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMjU3ODY5MTktYmFjYmRlNzctYWM4Ni00YzdhLWEzYzgtNzdlYzExNDViZjY4LmdpZiJdfSx7Ik5ldyB0YWIgYmFyIGljb25zIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzE3Mjc2ODIxLzEyNDY0NDYyMS0xMGZlZjUwMC1kZWM1LTExZWItOTFhNi0xNTgzNmQ5OTQxMDQucG5nIiwiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMjU3ODI5NTUtMGVhZjliODMtNWU0ZS00N2IyLWIyNTctNzBlNDA1NGE2MGFjLnBuZyJdfV0sIk1haW50ZW5hbmNlIjpbeyJjaG9yZShpbnZpdGUpOiBkaXNhYmxlIGludml0ZSBsaW5rcyBmb3IgdG9rZW5zIjpbImh0dHBzOi8vdXNlci1pbWFnZXMuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzcwOTg0NDkvMTI1NzgzMTEwLTExNmI0N2NhLWRmZjctNDBhOS1iYWJiLTdkZWJlOTFkY2MzZS5wbmciXX0seyJjaG9yZTogcmVuYW1lIFBheW1lbnRzIHBhZ2UgdG8gVHJhbnNmZXIiOlsiaHR0cHM6Ly91c2VyLWltYWdlcy5naXRodWJ1c2VyY29udGVudC5jb20vNzA5ODQ0OS8xMjU3ODMzMDQtYjhhOTFiZmQtNjVkYi00ZDFhLTk3ZTctOTA2NjhmYjA4Y2ZmLnBuZyJdfV19fQ==',
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
            Style: 'style',
          }[type],
          title: title[0].toUpperCase() + title.slice(1),
          imgs: content[1].map((i) => i.match(/https?.*?\.(png|jpg|gif)/)[0]),
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
        this.step += this.step < this.changelogImages.length + this.introSteps ? 1 : 0;
        if (this.step === this.changelogImages.length + this.introSteps) this.step = 1;
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

    &.style {
      color: variables.$color-green;
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

      &:only-child {
        flex-basis: 500px;
      }

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
