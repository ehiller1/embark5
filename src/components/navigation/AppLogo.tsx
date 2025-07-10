

export const AppLogo = () => {
  return (
    <h1 className="text-xl font-bold flex items-center text-black">
      <div className="flex-shrink-0 w-8 h-8 mr-2">
        <img 
          src="/images/EmbarkNow-whitescript-square copy.svg" 
          alt="EmbarkNow Logo" 
          className="w-full h-full" 
          style={{ objectFit: 'contain' }} 
        />
      </div>
      <span className="text-[#47799F]">EmbarkNow</span>
    </h1>
  );
};
