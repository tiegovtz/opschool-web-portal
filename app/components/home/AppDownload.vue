<template>
      <!-- app download links -->
      <div class="md:flex flex-col item-center justify-start gap-2 hidden ">
          <div class="flex item-center md:justify-start justify-center gap-2">

            <div aria-label="A rectangular black button with rounded corners. Inside, on the left, is the Google Play icon. To the right of the icon, the text ‘Google Play’ appears in white. On hover, the text color changes to blue. The button has small padding around the icon and text and is horizontally aligned with other buttons." class="play-store flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsPlayStore  />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500  ">
                Google play
              </p>
            </div>

            <!-- apple store  -->
            <div aria-label="A rectangular black button with rounded corners. Inside, on the left, is the Apple App Store icon in white. To the right of the icon, the text ‘Apple Store’ appears in white. On hover, the text color changes to blue. The button has small padding around the icon and text and is horizontally aligned with other buttons." class=" flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsAppStore class="cursor-pointer text-white group-hover:text-oceanBlue transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500">
                Apple store</p>
            </div>

          </div>
        </div>
</template>