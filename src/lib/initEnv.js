Object.assign(process.env, {
    ...process.env.RUNNING_IN_POPUP === undefined && {
      RUNNING_IN_POPUP: !!window.opener && window.name.includes('popup'),
    },
});