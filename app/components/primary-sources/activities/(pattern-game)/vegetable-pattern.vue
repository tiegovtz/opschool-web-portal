<script lang="tsx">
import { defineComponent, ref, computed, watch } from "vue";
import { DndContext, DragOverlay, useSensor, PointerSensor, TouchSensor, DragStartEvent, DragEndEvent } from "@dnd-kit/core";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import onion from "@/assets/activities-data/onion.png";
import tomato from "@/assets/activities-data/tomato.png";
import cabbage from "@/assets/activities-data/cabbage.png";
import brocolli from "@/assets/activities-data/brocolli.png";
import cucumber from "@/assets/activities-data/cucumber.png";
import green_pepper from "@/assets/activities-data/green-pepper.png";
import Draggable from "~/components/ui/dnd/draggable";
import Droppable from "~/components/ui/dnd/droppable";

type Vegetable = "broccoli" | "pepper" | "onion" | "tomato" | "cucumber" | "cabbage";

const patterns: Vegetable[][] = [
  ["broccoli","pepper","onion","broccoli","pepper","onion","broccoli","pepper","onion"],
  ["tomato","tomato","cucumber","cucumber","tomato","tomato","cucumber","cucumber","tomato"],
  ["cabbage","cabbage","cabbage","pepper","pepper","pepper","cabbage","cabbage","cabbage"],
  ["cucumber","cucumber","tomato","tomato","broccoli","broccoli","cucumber","cucumber","tomato"],
  ["tomato","onion","tomato","onion","tomato","onion","tomato","onion","tomato"],
  ["tomato","cucumber","broccoli","pepper","tomato","cucumber","broccoli","pepper","tomato"],
];

const patternAnswers: Vegetable[] = ["broccoli","tomato","pepper","tomato","onion","cucumber"];
const draggableVegetables: Vegetable[] = ["tomato","cucumber","broccoli","pepper","onion","cabbage"];

export default defineComponent({
  name: "VegetablePatternGame",
  setup() {
    const answers = ref<(Vegetable | null)[]>(Array(patternAnswers.length).fill(null));
    const score = ref(0);
    const allAnswered = ref(false);
    const activeId = ref<Vegetable | null>(null);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

    const getVegetableImage = (veg: Vegetable) => {
      switch (veg) {
        case "broccoli": return brocolli;
        case "pepper": return green_pepper;
        case "onion": return onion;
        case "tomato": return tomato;
        case "cucumber": return cucumber;
        case "cabbage": return cabbage;
      }
    };

    watch(answers, (newAnswers) => {
      allAnswered.value = newAnswers.every(a => a !== null);
    });

    const handleDragStart = (event: DragStartEvent) => {
      activeId.value = event.active.id as Vegetable;
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && String(over.id).startsWith("dropzone-")) {
        const dropzoneIndex = parseInt(String(over.id).split("-")[1] as string);
        const newAnswers = [...answers.value];
        newAnswers[dropzoneIndex] = active.id as Vegetable;
        answers.value = newAnswers;

        // score update safely
        if (newAnswers[dropzoneIndex] === patternAnswers[dropzoneIndex]) {
          score.value++;
        }
      }
    };

    const resetGame = () => {
      answers.value = Array(patternAnswers.length).fill(null);
      score.value = 0;
      allAnswered.value = false;
    };

    return () => (
      <div class="flex flex-col h-full">
        <h1 class="text-2xl text-center font-bold mb-4">
          Fill in the next vegetable in the pattern:
        </h1>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div class="flex flex-col grow justify-between">
            {patterns.map((pattern, rowIndex) => (
              <div class="flex items-center gap-10" key={rowIndex}>
                <div class="col-span-1 flex items-center font-bold">{rowIndex + 1}.</div>
                <div class="flex items-center justify-between grow">
                  {pattern.map((veg, colIndex) => (
                    <div class="w-12 h-12 flex items-center justify-center" key={`${rowIndex}-${colIndex}`}>
                      <img src={getVegetableImage(veg)} alt={veg} class="object-contain" />
                    </div>
                  ))}
                </div>
                <Droppable id={`dropzone-${rowIndex}`} class="w-12 h-12 border-2 border-dashed bg-lemon-300/50 flex items-center justify-center" isOverClassName="bg-lemon-400">
                  {answers.value[rowIndex] && <img src={getVegetableImage(answers.value[rowIndex]!)} alt={answers.value[rowIndex]} class="w-10 h-10 object-contain" />}
                </Droppable>
              </div>
            ))}
          </div>

          <div class="mt-8 flex justify-end space-x-10">
            {draggableVegetables.map(veg => (
              <Draggable key={veg} id={veg} class="w-16 h-16 flex items-center justify-center cursor-move">
                <img src={getVegetableImage(veg)} alt={veg} class="object-contain" />
              </Draggable>
            ))}
          </div>

          <DragOverlay>
            {activeId.value && (
              <div class="w-16 h-16 flex items-center justify-center opacity-80">
                <img src={getVegetableImage(activeId.value)} alt={activeId.value} class="object-contain" />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {allAnswered.value && (
          <AlertDialog open={allAnswered.value} onOpenChange={resetGame}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Game Over</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>
                You scored {score.value} out of {patternAnswers.length}.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogAction>Play Again</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }
});
</script>