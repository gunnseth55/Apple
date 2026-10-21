import Link from 'next/link';

export default function Home() {
  return (
    <div >
      <nav>
        <div className=''>
          <div className="flex gap-12 justify-center px-20 py-10">
            <Link href="/" className='hover:font-bold'>Home</Link>
            <Link href="/" className='hover:font-bold'>Marketplace</Link>
            <Link href="/" className='hover:font-bold'>apple</Link>
            <Link href="/" className='hover:font-bold'>Market Prices</Link>
            <Link href="/" className='hover:font-bold'>About</Link>
          </div>
        </div>
      </nav>
      
        
        <div className='ml-16 mr-16 h-140  bg-green-200 rounded-2xl ' >
          <div className='flex justify-center'>
            <h1>AppleMandi</h1>
          </div>
        </div>


        <div className='ml-40 mr-40 h-120 py-16'>
          <div className='grid grid-cols-2 gap-4'>
          <div className='bg-amber-100 rounded-2xl'>
            <div></div>
          </div>
          <div className=''>
            <div className='grid grid-rows-3 grid-flow-col gap-4 h-100'>
              <div className='bg-amber-300 rounded-2xl'></div>
              <div className='row-span-2 bg-orange-300 rounded-2xl'></div>
              <div className='bg-blue-300 rounded-2xl'></div>
              <div className='bg-green-300 rounded-2xl'></div>
              <div className='bg-pink-300 rounded-2xl'></div>
            </div>
          </div>
            </div>
          
        </div>


        <div className='mr-40 ml-40 py-18'>
            <div>
                <div className='flex justify-center mb-6'><h1 className='text-4xl '>Top Orchardists</h1></div>
                <div className='grid grid-cols-3 h-80 gap-4'>
                  <div className='bg-blue-600 flex flex-col justify-end rounded-2xl'><button className='bg-white text-blue-600 p-2 hover:bg-blue-600 hover:text-white cursor-pointer'>Check Now</button></div>
                  <div className='bg-blue-600 flex flex-col justify-end rounded-2xl'><button className='bg-white text-blue-600 p-2 hover:bg-blue-600 hover:text-white cursor-pointer'>Check Now</button></div>
                  <div className='bg-blue-600 flex flex-col justify-end rounded-2xl'><button className='bg-white text-blue-600 p-2 hover:bg-blue-600 hover:text-white cursor-pointer'>Check Now</button></div>
                </div>
            </div>

        </div>

          <div className='ml-16 mr-16 h-140  bg-pink-200 rounded-2xl ' >
          <div className='grid grid-cols-2 grid-rows-2 h-full gap-4 p-14'>

            <div> 
              <h1 className='text-4xl'>AppleMandi</h1>
              <div>Connecting farmers, merchants, and buyers through a smarter agricultural marketplace.</div>
              <div className='flex flex-row gap-2'>
                <Link href='\'>Instagram</Link>
                <Link href='\'>Facebook</Link>
                <Link href='\'>LinkedIn</Link>
              </div>
            </div>
            <div>
              <h1 className='text-2xl'>Quick Links</h1>
              <div className='flex flex-col'>
                <Link href='\'>Home</Link>
                <Link href='\'>Marketplace</Link>
                <Link href='\'>Market Prices</Link>
                <Link href='\'>About Us</Link>
              </div>
            </div>
            <div>
              <h1 className='text-2xl'>For Merchants</h1>
              <div className='flex flex-col'>
                <Link href='\'>Become a Merchant</Link>
                <Link href='\'>Manage Listings</Link>
                <Link href='\'>Pricing Insights</Link>
                <Link href='\'>Worker Management</Link>
              </div>
            </div>
            <div>
              <h1 className='text-2xl'>Supports & Legal</h1>
              <div className='flex flex-col'>
                <Link href='\'>Help Center</Link>
                <Link href='\'>Contact Us</Link>
                <Link href='\'>Privacy Policy</Link>
                <Link href='\'>Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>

        <footer>
          <div className='flex flex-row justify-between px-4 py-4'>
            <div >© 2026 AppleMandi. All rights reserved.</div>
            <div >English | हिन्दी</div>
          </div>
        </footer>
    </div>
  );
}
