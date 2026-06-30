const AnimatedLogo = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-sm"
  >
    {/* Левая спица */}
    <line x1="25" y1="20" x2="25" y2="80" stroke="#B38B5B" strokeWidth="2.5" strokeLinecap="round">
      <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0s" fill="freeze" />
    </line>
    <circle cx="25" cy="20" r="4" fill="#DCC7A3">
      <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0s" fill="freeze" />
    </circle>

    {/* Правая спица */}
    <line x1="75" y1="20" x2="75" y2="80" stroke="#B38B5B" strokeWidth="2.5" strokeLinecap="round">
      <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.2s" fill="freeze" />
    </line>
    <circle cx="75" cy="20" r="4" fill="#DCC7A3">
      <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="0.2s" fill="freeze" />
    </circle>

    {/* Нить, обвивающая спицы (анимация рисования) */}
    <path
      d="M25,30 Q50,45 25,60 Q50,75 25,85"
      stroke="#00E5A0"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      strokeDasharray="100"
      strokeDashoffset="100"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="100" to="0"
        dur="2s"
        begin="0.5s"
        fill="freeze"
      />
    </path>

    {/* Мишка (появляется после нити) */}
    <g opacity="0">
      <animate attributeName="opacity" from="0" to="1" dur="1s" begin="2.5s" fill="freeze" />
      {/* Уши */}
      <circle cx="40" cy="38" r="5" fill="#DCC7A3" />
      <circle cx="60" cy="38" r="5" fill="#DCC7A3" />
      <circle cx="40" cy="38" r="2.5" fill="#F5D5C6" />
      <circle cx="60" cy="38" r="2.5" fill="#F5D5C6" />
      {/* Голова */}
      <circle cx="50" cy="50" r="10" fill="#DCC7A3" />
      {/* Мордочка */}
      <circle cx="50" cy="53" r="4" fill="#F5D5C6" />
      <circle cx="50" cy="52" r="1.2" fill="#4A3522" />
      {/* Глаза */}
      <circle cx="46" cy="48" r="1.5" fill="#4A3522" />
      <circle cx="54" cy="48" r="1.5" fill="#4A3522" />
      {/* Тело */}
      <ellipse cx="50" cy="70" rx="12" ry="14" fill="#DCC7A3" />
      {/* Лапки */}
      <circle cx="40" cy="76" r="4" fill="#DCC7A3" />
      <circle cx="60" cy="76" r="4" fill="#DCC7A3" />
    </g>
  </svg>
);
