<template>
      <!-- app download links -->
      <div class="md:flex flex-col item-center justify-start gap-2 hidden ">
          <div class="flex item-center md:justify-start justify-center gap-2">

            <div class="play-store flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsPlayStore class="cursor-pointer transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500  ">
                Google play</p>
            </div>

            <!-- apple store  -->
            <div class=" flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsAppStore class="cursor-pointer text-white group-hover:text-oceanBlue transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500">
                Apple store</p>
            </div>

          </div>
        </div>
</template>