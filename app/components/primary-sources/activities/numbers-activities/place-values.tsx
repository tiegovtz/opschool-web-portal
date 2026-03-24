import React, { useState } from "react";

interface PlaceValueBlocksProps {
  maxNumber?: number;
}

const PlaceValueBlocks: React.FC<PlaceValueBlocksProps> = ({
  maxNumber = 9999,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [currentNumber, setCurrentNumber] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 10;

  const handleSubmit = () => {
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= 0 && num <= maxNumber) {
      setCurrentNumber(num);
    }
  };

  const handleNextQuestion = () => {
    // Generate random number for next question
    const randomNum = Math.floor(Math.random() * (maxNumber + 1));
    setCurrentNumber(randomNum);
    setInputValue("");
    setCurrentQuestion((prev) => (prev < totalQuestions ? prev + 1 : 1));
  };

  const getPlaceValues = (num: number) => {
    return {
      thousands: Math.floor(num / 1000),
      hundreds: Math.floor((num % 1000) / 100),
      tens: Math.floor((num % 100) / 10),
      ones: num % 10,
    };
  };

  const renderSimpleCube = (size: number, color: string, index: number) => {
    return (
      <div
        key={index}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          margin: "8px",
          display: "inline-block",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(-10deg) rotateY(-10deg)",
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `translateZ(${size / 2}px)`,
          }}
        />

        {/* Back face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `translateZ(-${size / 2}px) rotateY(180deg)`,
          }}
        />

        {/* Right face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.7)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateY(90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Left face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.7)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Top face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(1.2)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateX(90deg) translateZ(${size / 2}px)`,
          }}
        />

        {/* Bottom face */}
        <div
          style={{
            position: "absolute",
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            filter: "brightness(0.5)",
            border: "1px solid rgba(0,0,0,0.2)",
            transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
          }}
        />
      </div>
    );
  };

  const renderThousandBlock = (color: string = "#f59e0b") => {
    return renderSimpleCube(100, color, 0); // Largest cube for thousands
  };

  const renderHundredBlock = (color: string = "#10b981") => {
    return renderSimpleCube(60, color, 0); // Large cube for hundreds
  };

  const renderTenBlock = (color: string = "#3b82f6") => {
    return renderSimpleCube(40, color, 0); // Medium cube for tens
  };

  const renderOneBlock = (color: string = "#ef4444") => {
    return renderSimpleCube(25, color, 0); // Small cube for ones
  };

  const placeValues = getPlaceValues(currentNumber);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-900">
        Place Value Blocks
      </h1>

      <div className="bg-white rounded-lg p-6 mb-6 shadow-inner">
        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Thousands
            </h3>
            <div className="grid grid-cols-3 gap-10 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
              {Array.from({ length: placeValues.thousands }).map((_, i) => (
                <div key={i}>{renderThousandBlock()}</div>
              ))}
              {placeValues.thousands === 0 && (
                <div className="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
                  No thousands
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Hundreds
            </h3>
            <div className="grid grid-cols-3 gap-4 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
              {Array.from({ length: placeValues.hundreds }).map((_, i) => (
                <div key={i}>{renderHundredBlock()}</div>
              ))}
              {placeValues.hundreds === 0 && (
                <div className="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
                  No hundreds
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Tens</h3>
            <div className="grid grid-cols-2 gap-3 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
              {Array.from({ length: placeValues.tens }).map((_, i) => (
                <div key={i}>{renderTenBlock()}</div>
              ))}
              {placeValues.tens === 0 && (
                <div className="col-span-4 flex items-center justify-center h-full text-gray-400 italic">
                  No tens
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Ones</h3>
            <div className="grid grid-cols-1 gap-2 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
              {Array.from({ length: placeValues.ones }).map((_, i) => (
                <div key={i}>{renderOneBlock()}</div>
              ))}
              {placeValues.ones === 0 && (
                <div className="col-span-5 flex items-center justify-center h-full text-gray-400 italic">
                  No ones
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <p className="text-lg font-medium mb-4 text-gray-700">
          Write the complete number:
        </p>
        <div className="flex gap-4 items-center mb-6">
          <input
            type="number"
            min="0"
            max={maxNumber}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter the number"
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 w-48"
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Show Blocks
          </button>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {currentQuestion} of {totalQuestions} questions
          </p>
          <button
            onClick={handleNextQuestion}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Next Question
          </button>
        </div>

        <div className="flex gap-2 mt-4 justify-center">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i + 1)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentQuestion === i + 1
                  ? "bg-blue-500 text-white border-2 border-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {currentNumber > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-xl font-semibold text-blue-900">
            {currentNumber} ={" "}
            {placeValues.thousands > 0 &&
              `${placeValues.thousands} thousand${
                placeValues.thousands > 1 ? "s" : ""
              }`}
            {placeValues.thousands > 0 &&
              (placeValues.hundreds > 0 ||
                placeValues.tens > 0 ||
                placeValues.ones > 0) &&
              " + "}
            {placeValues.hundreds > 0 &&
              `${placeValues.hundreds} hundred${
                placeValues.hundreds > 1 ? "s" : ""
              }`}
            {placeValues.hundreds > 0 &&
              (placeValues.tens > 0 || placeValues.ones > 0) &&
              " + "}
            {placeValues.tens > 0 &&
              `${placeValues.tens} ten${placeValues.tens > 1 ? "s" : ""}`}
            {placeValues.tens > 0 && placeValues.ones > 0 && " + "}
            {placeValues.ones > 0 &&
              `${placeValues.ones} one${placeValues.ones > 1 ? "s" : ""}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlaceValueBlocks;
