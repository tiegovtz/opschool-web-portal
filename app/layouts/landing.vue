<template>
    <div class="bg-white h-dvh" @contextmenu.prevent>
        <!-- Header -->
         <included-upper-header/>
        <!-- content -->
         <main class="px-4  bg-[url('/images/bg-icons.png')] bg-cover bg-center bg-no-repeat" >
            <section class="md:p-4 p-2 !center-height w-full max-w-screen-xl mx-auto flex flex-col justify-center">
                <slot></slot>
            </section>
         </main>
        <!-- Footer -->
         <included-footer-view/>
    </div>
</template>                      