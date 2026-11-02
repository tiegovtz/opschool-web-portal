<template>
      <!-- app download links -->
      <div  class="md:flex flex-col item-center justify-start gap-2 hidden ">
          <div class="flex item-center md:justify-start justify-center gap-2">

            <nuxt-link target="blank" to="https://play.google.com/store/apps/details?id=tz.tie.online&pcampaignid=web_share" aria-label="A rectangular transparent button with rounded corners. Inside, on the left, is the Google Play icon. To the right of the icon, the text ‘Google Play’ appears in white. On hover, the text color changes to blue. The button has small padding around the icon and text and is horizontally aligned with other buttons."
            class="play-store inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-1 text-center text-sm font-medium text-white whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group">
              <IconsPlayStore  />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-deepBlue transition-all duration-500  ">
                Google play
              </p>
            </nuxt-link>

            <!-- apple store  -->
            <nuxt-link target="blank" to="#" aria-label="A rectangular transparent button with rounded corners. Inside, on the left, is the Apple App Store icon in white. To the right of the icon, the text ‘Apple Store’ appears in white. On hover, the text color changes to blue. The button has small padding around the icon and text and is horizontally aligned with other buttons."
            class="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-1 text-center text-sm font-medium text-white whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group">
              <IconsAppStore class="cursor-pointer text-white group-hover:text-deepBlue transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-deepBlue transition-all duration-500">
                Apple store</p>
            </nuxt-link>

          </div>
        </div>
</template>
